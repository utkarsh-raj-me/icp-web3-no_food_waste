#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting Food Waste Platform Integration Tests..."

# 1. Check DFX
echo -n "Checking dfx installation... "
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}dfx not found. Please install dfx first.${NC}"
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# 2. Start local replica if not running
echo -n "Checking dfx replica status... "
if ! dfx ping &> /dev/null; then
    echo -e "${RED}not running${NC}"
    echo "Starting dfx replica..."
    dfx start --clean --background
    sleep 5
else
    echo -e "${GREEN}running${NC}"
fi

# 3. Deploy canisters
echo "Deploying canisters..."
dfx deploy

# 4. Get canister IDs
LEDGER_ID=$(dfx canister id ledger)
FOOD_WASTE_ID=$(dfx canister id food_waste)

echo -e "\nDeployment Information:"
echo "Ledger Canister ID: $LEDGER_ID"
echo "Food Waste Canister ID: $FOOD_WASTE_ID"

# 5. Create test identity
echo -n "Creating test identity... "
dfx identity new --disable-encryption test_identity 2>/dev/null || true
dfx identity use test_identity
PRINCIPAL=$(dfx identity get-principal)
echo -e "${GREEN}OK${NC}"
echo "Test Principal: $PRINCIPAL"

# 6. Test basic functionalities
echo -e "\nTesting basic functionalities..."

# Test creating a listing
echo "Creating a test listing..."
LISTING_ID=$(dfx canister call food_waste createListing "(
  \"Fresh Vegetables\",
  \"Assorted fresh vegetables from local farm\",
  100000:nat,
  \"Produce\",
  record {
    latitude = 37.7749;
    longitude = -122.4194;
    address = \"San Francisco, CA\";
  },
  $(date +%s)000000000:int,
  10:nat,
  vec {}
)")
echo "Listing ID: $LISTING_ID"

# Test getting the listing
echo "Fetching the created listing..."
dfx canister call food_waste getListing "(\"$LISTING_ID\")"

# Test creating a purchase
echo "Creating a test purchase..."
PURCHASE_ID=$(dfx canister call food_waste createPurchase "(\"$LISTING_ID\", 2:nat)")
echo "Purchase ID: $PURCHASE_ID"

# Test getting the purchase
echo "Fetching the created purchase..."
dfx canister call food_waste getPurchase "(\"$PURCHASE_ID\")"

# Test getting system stats
echo "Fetching system stats..."
dfx canister call food_waste getStats

echo -e "\n${GREEN}Integration tests completed!${NC}" 