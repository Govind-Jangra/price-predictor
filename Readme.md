
# Node.js Express API Setup and Usage Guide

This project is an API built with Node.js and Express. It allows users to upload an Excel file, select a carrier, and calculate total charges and future increases based on the carrier's rate of increase. Below is the setup guide to install, run, and test the API, including environment variables, dependencies, and how to test the API using Postman.

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14.x or later)
- [npm](https://www.npmjs.com/)
- [Postman](https://www.postman.com/downloads/)

## Installation

1. **Clone the repository**

   ```
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies**

   Run the following command to install the necessary Node.js packages:

   ```
   npm install
   ```

## Setup

1. **Create the `.env` file**

   In the root directory of the project, create a `.env` file and add the following environment variables:

   ```
   PORT=5000
   OPENAI_API_KEY=<your-openai-api-key>
   ```

   Replace `<your-openai-api-key>` with your actual OpenAI API key. You can obtain the key from the [OpenAI website](https://beta.openai.com/signup/).

2. **Ensure necessary files are in place**

   - Place `rate-of-increase.json` in the root directory. This file contains the rate of increase data for different carriers (e.g., UPS, FedEx).
   - Ensure `get-columns-for-contract.js` is available in the `utils/` folder. This utility extracts columns from the uploaded file.

## Running the Application

1. **Start the server**

   Use the following command to start the server:

   ```
   npm start
   ```

   If the environment variable `PORT` is set in the `.env` file, the server will run on that port. Otherwise, it defaults to port 5000.

   You should see a message like:

   ```
   Server running on port 5000
   ```

2. **Health Check**

   You can check if the server is running by visiting:

   ```
   http://localhost:5000/healthcheck
   ```

   You should receive a response:

   ```
   PLD is working
   ```

## API Endpoints

### POST `/calculate`

#### Request:
To test the `/calculate` endpoint with Postman:

1. Open Postman and create a new request.
2. Set the request method to `POST`.
3. Enter the following URL:

   ```
   http://localhost:5000/calculate
   ```

4. Under the `Body` tab, select `form-data`.
5. Add the following fields:
   - **carrier**: Name of the carrier (e.g., "UPS", "FedEx").
   - **file**: The Excel file (`.xlsx`) containing the charges data. Ensure the file has a sheet named `datasheet`. File should be in xlsx format and main content should be present in datasheet workbook.

6. Send the request.

#### Example Request Body:

- **carrier**: `UPS`
- **file**: Select your Excel file from your computer (in form-data).

#### Response:

On success, the server will return a JSON response containing the following:

- **totals**: The total charges for each column in the Excel file.
- **rateOfIncrease**: The rate of increase for each column for the years 2025, 2026, 2027, and 2028.
- **futureTotals**: The calculated totals for each year.

Example response:

```json
{
    "totals": {
        "base_rate": 2284623.3,
        "total_charge": 1431504.84,
         "discount" : 37.34,
        "das": 20771,
        "edas": 14806,
        "delivery_and_returns": 0,
        "fuel_surcharge": 198766.34
    },
    "rateOfIncrease": {
        "base_rate": {
            "2025": 3.4,
            "2026": 3.3,
            "2027": 3.2,
            "2028": 1.6
        },
        "total_charge": {
            "2025": 3.3,
            "2026": 3.2,
            "2027": 1.6,
            "2028": 3.1
        },
        "das": {
            "2025": 3.2,
            "2026": 3.2,
            "2027": 3.2,
            "2028": 1.5
        },
        "edas": {
            "2025": 3.3,
            "2026": 3.3,
            "2027": 1.6,
            "2028": 1.6
        },
        "delivery_and_returns": {
            "2025": 3.4,
            "2026": 3.3,
            "2027": 1.6,
            "2028": 1.6
        },
        "fuel_surcharge": {
            "2025": 3.3,
            "2026": 3.2,
            "2027": 1.5,
            "2028": 3.1
        }
    },
    "futureTotals": {
        "base_rate": {
            "2025": 2362300.49,
            "2026": 2440256.41,
            "2027": 2518344.62,
            "2028": 2558638.13
        },
        "total_charge": {
            "2025": 1478744.5,
            "2026": 1526064.32,
            "2027": 1550481.35,
            "2028": 1598546.27
        },
        "das": {
            "2025": 21435.67,
            "2026": 22121.61,
            "2027": 22829.5,
            "2028": 23171.94
        },
        "edas": {
            "2025": 15294.6,
            "2026": 15799.32,
            "2027": 16052.11,
            "2028": 16308.94
        },
        "delivery_and_returns": {
            "2025": 0,
            "2026": 0,
            "2027": 0,
            "2028": 0
        },
        "fuel_surcharge": {
            "2025": 205325.63,
            "2026": 211896.05,
            "2027": 215074.49,
            "2028": 221741.8
        }
    }
}
```

#### Error Handling:

- If the `carrier` field is missing, you'll receive a `400` status with the message:

  ```
  No carrier type specified.
  ```

- If the file is missing, you'll receive a `400` status with the message:

  ```
  No file uploaded.
  ```

- If any internal server error occurs, you'll receive a `500` status with the message:

  ```
  Error processing the file.
  ```

## Testing with Postman

Here’s a step-by-step guide to testing the API with Postman:

1. **Start the server** by running `npm start`.
2. **Open Postman** and create a new POST request.
3. **Set the URL** to `http://localhost:5000/calculate`.
4. **Select `Body > form-data`** in Postman and add the fields:
   - **carrier**: The carrier name (e.g., "UPS").
   - **file**: The Excel file to upload.
5. **Send the request**.
6. **Check the response** to see the totals and future rates.

## Conclusion

You have now set up the project, configured environment variables, installed necessary dependencies, and run the server. You can interact with the `/calculate` endpoint using Postman to upload Excel files and get future rate projections based on the carrier data.

For any issues or questions, please refer to the [GitHub Issues](https://github.com/your-repository/issues) section.
