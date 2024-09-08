import mongoose from 'mongoose';

const { Schema } = mongoose;

const priceRateSchema = new Schema({
    Quantity: {
        minQuantity: { type: Number }, // eg: 1, 2, 3
        maxQuantity: { type: Number }, // eg: 1, 2, 3
    },
    Weight: {
        minWeight: { type: Number }, // eg: 1, 2, 3
        maxWeight: { type: Number }, // eg: 1, 2, 3
        type: { type: String } // eg: kg, g, lb
    },
    Distribution: { type: String }, // eg: Even, HigherWeight, LowerWeight
    miscellaneous: { type: String }, // eg: Letter, Box, Normal
    zones: { type: String },  // eg. 101, 102, 103
    rate: {
        currency: { type: String }, // eg: $, €
        StartingPrice: { type: Number }, // eg: 10.00
        EndingPrice: { type: Number }, // optional field
        weightDependent: { type: Boolean }, // eg: true
        minimumPrice: { type: Number } // eg: 10.00
    },
    service: {
        type: { type: String }, // eg: Export, Import, Domestic
        name: { type: String }  // eg. UPS Next Day Air® Early
    }
});

const PriceRate = mongoose.model('PriceRate', priceRateSchema);

export default PriceRate;
