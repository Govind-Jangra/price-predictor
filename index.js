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
    let carrier = (req.body.carrier) || "FedEx";

    if (!carrier) {
        return res.status(400).send('Carrier type not specified.');
    }
    
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log("processing")
    try {
        const workbook = xlsx.readFile(file.path);
        const sheet = workbook.Sheets["datasheet"];
        const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        const headerRow = Object.keys(data[0]);
        const columns = await getColumnsForContract(headerRow);
        
        let totals = {};
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

        const openAIResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { "type": "json_object" },
            messages: [
                {
                    role: 'system',
                    content: `You have the following rate of increase data for shipping carriers UPS and FedEx as a JSON object: ::: ${JSON.stringify(rateofincrease)} :::. Your task is to provide the rate of increase in percentage for carrier ${carrier} based on the provided JSON data for the following types of charges: ::: ${JSON.stringify(columns)} :::.
                    - Always extract the rate of increase directly from the JSON data when available.
                    - If a charge type's rate of increase for a specific year is missing from the JSON data, provide a rough estimate.
                    - Important ::: Always Add discount property in response json format                  
                    - The response should be in this JSON format: {"<chargeType1>": {"2025": 5.9, "2026": 6.9, "2027": 5.9, "2028": 4.9}, "<chargeType2>": {"2025": 5.9, "2026": 6.9, "2027": 5.9, "2028": 4.9},"discount":<(total_rate-base_rate)/(total_rate)>}.
                    - Always provide rates for all charges listed in ::: ${JSON.stringify(columns)} ::: for the years 2025, 2026, 2027, and 2028.
                    - If a rate is not present in the JSON data, you may estimate it.
                    - Each type of charge should have rate of increase for the years
                    - Only provide json without comments`
                },
                {
                    role: 'user',
                    content: "Give response in JSON format"
                }
            ]
        });

        const responseContent = openAIResponse.choices[0].message.content.trim();
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

        const allowedValues = ["Base Rate", "Total Charge", "DAS", "EDAS", "Delivery and Returns", "Fuel Surcharge"];

        const allowedResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { "type": "json_object" },
            messages: [
                {
                    role: 'system',
                    content: `You will be provided inputs for totals and futureTotals in json. Format the result based on allowedValues = ${JSON.stringify(allowedValues)}. Write all allowedValues if the allowedValue is not present in user input remove it and if userinput does not contain allowed value fill it with 0. The response format should be: {"totals": {...}, "futureTotals": {...}}`
                },
                {
                    role: 'user',
                    content: `Give response in JSON format after formatting: {"totals": ${JSON.stringify(totals)}, "futureTotals": ${JSON.stringify(futureTotals)}}`
                }
            ]
        });

        
        const allowedresponseContent = allowedResponse.choices[0].message.content.trim();
        const allowedRes = JSON.parse(allowedresponseContent);
        const carrierRateOfIncrease = {
            "2025": {
              "Base Rate": rateofincrease[carrier]["2025"]["Base Rate"],
              "Total Charge": rateofincrease[carrier]["2025"]["Total Charge"],
              "DAS": rateofincrease[carrier]["2025"]["DAS"],
              "EDAS": rateofincrease[carrier]["2025"]["EDAS"],
              "Delivery and Returns": rateofincrease[carrier]["2025"]["Delivery and Returns"],
              "Fuel Surcharge": rateofincrease[carrier]["2025"]["Fuel Surcharge"],
              "GRI": rateofincrease[carrier]["2025"]["GRI"],
              "Signature Required": rateofincrease[carrier]["2025"]["Signature Required"],
              "Return": rateofincrease[carrier]["2025"]["Return"],
              "residential_surcharge": rateofincrease[carrier]["2025"]["residential_surcharge"],
              "additional_handling": rateofincrease[carrier]["2025"]["additional_handling"]
            },
            "2026": {
              "Base Rate": rateofincrease[carrier]["2026"]["Base Rate"],
              "Total Charge": rateofincrease[carrier]["2026"]["Total Charge"],
              "DAS": rateofincrease[carrier]["2026"]["DAS"],
              "EDAS": rateofincrease[carrier]["2026"]["EDAS"],
              "Delivery and Returns": rateofincrease[carrier]["2026"]["Delivery and Returns"],
              "Fuel Surcharge": rateofincrease[carrier]["2026"]["Fuel Surcharge"],
              "GRI": rateofincrease[carrier]["2026"]["GRI"],
              "Signature Required": rateofincrease[carrier]["2026"]["Signature Required"],
              "Return": rateofincrease[carrier]["2026"]["Return"],
              "residential_surcharge": rateofincrease[carrier]["2026"]["residential_surcharge"],
              "additional_handling": rateofincrease[carrier]["2026"]["additional_handling"]
            },
            "2027": {
              "Base Rate": rateofincrease[carrier]["2027"]["Base Rate"],
              "Total Charge": rateofincrease[carrier]["2027"]["Total Charge"],
              "DAS": rateofincrease[carrier]["2027"]["DAS"],
              "EDAS": rateofincrease[carrier]["2027"]["EDAS"],
              "Delivery and Returns": rateofincrease[carrier]["2027"]["Delivery and Returns"],
              "Fuel Surcharge": rateofincrease[carrier]["2027"]["Fuel Surcharge"],
              "GRI": rateofincrease[carrier]["2027"]["GRI"],
              "Signature Required": rateofincrease[carrier]["2027"]["Signature Required"],
              "Return": rateofincrease[carrier]["2027"]["Return"],
              "residential_surcharge": rateofincrease[carrier]["2027"]["residential_surcharge"],
              "additional_handling": rateofincrease[carrier]["2027"]["additional_handling"]
            },
            "2028": {
              "Base Rate": rateofincrease[carrier]["2028"]["Base Rate"],
              "Total Charge": rateofincrease[carrier]["2028"]["Total Charge"],
              "DAS": rateofincrease[carrier]["2028"]["DAS"],
              "EDAS": rateofincrease[carrier]["2028"]["EDAS"],
              "Delivery and Returns": rateofincrease[carrier]["2028"]["Delivery and Returns"],
              "Fuel Surcharge": rateofincrease[carrier]["2028"]["Fuel Surcharge"],
              "GRI": rateofincrease[carrier]["2028"]["GRI"],
              "Signature Required": rateofincrease[carrier]["2028"]["Signature Required"],
              "Return": rateofincrease[carrier]["2028"]["Return"],
              "residential_surcharge": rateofincrease[carrier]["2028"]["residential_surcharge"],
              "additional_handling": rateofincrease[carrier]["2028"]["additional_handling"]
            }
          };

        fs.unlinkSync(file.path);

        res.json({
            ...allowedRes,
            carrierRateOfIncrease
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
