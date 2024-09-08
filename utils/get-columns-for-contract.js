import OpenAI from 'openai';
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getColumnsForContract = async (headerRow) => {
    const systemPrompt = {
        role: 'system',
        content: `You will be provided a header row in array of strings format for PLD. You have to give me array of strings containing column name. You have to give me related fields for charges/amount from  {base rate,amount paid/total amount, fuel surcharge,das(delivery area surcharge),edas(extended delivery area surcharge),delivery and returns, and other types of charges if present in the header row.}. Always give array of strings if you dont find any related field in the header row then give empty array.Response should be only array of strings like : ["","",""] nothing else.`
    };
    const userPrompt = {
        role: 'user',
        content: "header row :: [" + headerRow.toString() + "]",
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemPrompt,
          userPrompt
        ]
    });
    
    const responseContent = response.choices[0].message.content.trim();
   
    const sanitizedContent = responseContent.replace(/'/g, '"');
    const columns = JSON.parse(sanitizedContent);
    return columns;
};

export default getColumnsForContract;
