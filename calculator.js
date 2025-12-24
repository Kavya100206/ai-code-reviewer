// Simple calculator with bugs for AI to detect

function divide(a, b) {
    // Bug: No check for division by zero
    return a / b;
}

function getUserInput() {
    // Bug: Using eval is a security risk
    const input = prompt("Enter calculation:");
    return eval(input);
}

function calculateTotal(prices) {
    let total = 0;
    // Bug: Variable name typo
    for (let i = 0; i < prices.length; i++) {
        total += price[i];  // Should be prices[i]
    }
    return total;
}

// Bug: Storing password in plain text
const config = {
    apiKey: "hardcoded-api-key-12345",
    password: "admin123"
};

module.exports = { divide, getUserInput, calculateTotal };
