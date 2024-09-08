import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import cors from 'cors';
import OpenAI from 'openai';
import rateofincrease from './rate-of-increase.json' assert { type: 'json' };
import getColumnsForContract from './utils/get-columns-for-contract.js';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

app.use(cors("*"));

app.post('/calculate',
      upload.single('file'), 
     async (req, res) => {
     const file = req.file;
      let carrier=(req.body.carrier);

      if(!carrier) {
        return res.status(400).send('No carrier type specify.');
      }
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets["datasheet"];
    const data = xlsx.utils.sheet_to_json(sheet);

    try {
        const headerRow = Object.keys(data[0]);
        const columns = await getColumnsForContract(headerRow);
        let totals={};
        for (const column of columns) {
            let total = 0;

            data.forEach(row => {
                const value = parseFloat(row[column].toString().replace('$', '').trim());

                if (!isNaN(value)) {
                    total += value;
                }
            });

            totals[column] = parseFloat(total.toFixed(2));
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format:{ "type": "json_object" },
            messages: [
              {
                role: 'system',
                content: `carrier shipping company rate of increase data  UPS,FedEx JSON data ::: ${JSON.stringify(rateofincrease)}`
                + `:::. Using the above json data You have to give me rate of increase for carrier ${carrier} in percentage for the following type of charges ::: `+
                 JSON.stringify(columns)+
                 " :::. Always give rate of increase in percentage for the next 4 years in the following format : {`<chargetype1>`:{2025: 5.9, 2026: 6.9, 2027: 5.9, 2028: 4.9}, `<chargetype2`:{2025: 5.9, 2026: 6.9, 2027: 5.9, 2028: 4.9}}.  Response should be only JSON format like and nothing else." + "Always give response for the following types of charges ::: "+JSON.stringify(columns) + "::: and always give increase for every type of charges for years 2025,2026,2027,2028. If the inrease is not present in the json you can take rough estimate."
              },
              {
                role: 'user',
                content: "Give response in JSON format",
              }
            ]
        });

        const responseContent = response.choices[0].message.content.trim();
        const rateOfIncrease = JSON.parse(responseContent);
        
        let futureTotals = {};

        for (const column of columns) {
            if (rateOfIncrease[column]) {
                const totalForColumn = totals[column];
                const yearlyIncrease = rateOfIncrease[column];
        
                let year1 = (totalForColumn * (1 + yearlyIncrease["2025"] / 100)).toFixed(2);
                let year2 = (year1 * (1 + yearlyIncrease["2026"] / 100)).toFixed(2);
                let year3 = (year2 * (1 + yearlyIncrease["2027"] / 100)).toFixed(2);
                let year4 = (year3 * (1 + yearlyIncrease["2028"] / 100)).toFixed(2);
        
                futureTotals[column] = {
                    2025: parseFloat(year1),
                    2026: parseFloat(year2),
                    2027: parseFloat(year3),
                    2028: parseFloat(year4)
                };
            }
        }
        fs.unlinkSync(file.path);
        res.json({
            totals: totals,
            rateOfIncrease: rateOfIncrease,
            futureTotals: futureTotals
        });
    } catch (error) {
        fs.unlinkSync(file.path);
        console.error('Error processing the file:', error);
        res.status(500).send('Error processing the file.');
    }
});


app.get("/healthcheck",(req,res)=>{
    res.send("PLD is working")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
