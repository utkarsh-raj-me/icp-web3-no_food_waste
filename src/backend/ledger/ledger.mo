import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";

actor TestLedger {
    public type AccountIdentifier = Text;  // Using Text instead of [Nat8] for simplicity
    public type Tokens = { e8s : Nat };
    public type Timestamp = { timestamp_nanos : Nat64 };
    public type Duration = { duration_nanos : Nat64 };
    public type BlockIndex = Nat64;
    public type Memo = Nat64;
    public type SubAccount = Text;  // Using Text instead of [Nat8] for simplicity

    private let accounts = HashMap.HashMap<AccountIdentifier, Nat>(1, Text.equal, Text.hash);
    private var nextBlockIndex : BlockIndex = 0;
    private let EXPECTED_FEE : Nat = 10_000; // 0.0001 ICP in e8s

    public type TransferArgs = {
        memo : Memo;
        amount : Tokens;
        fee : Tokens;
        from_subaccount : ?SubAccount;
        to : AccountIdentifier;
        created_at_time : ?Timestamp;
    };

    public type TransferError = {
        #BadFee : { expected_fee : Tokens };
        #InsufficientFunds : { balance : Tokens };
        #TxTooOld : { allowed_window_nanos : Duration };
        #TxCreatedInFuture;
        #TxDuplicate : { duplicate_of : BlockIndex };
    };

    public type TransferResult = {
        #Ok : BlockIndex;
        #Err : TransferError;
    };

    public shared(msg) func transfer(args : TransferArgs) : async TransferResult {
        // Check the fee
        if (args.fee.e8s != EXPECTED_FEE) {
            return #Err(#BadFee { expected_fee = { e8s = EXPECTED_FEE } });
        };

        // Check timestamp if provided
        switch (args.created_at_time) {
            case (?time) {
                let now = Nat64.fromIntWrap(Time.now()); // Time.now() returns Int (nanoseconds)
                if (time.timestamp_nanos > now) {
                    return #Err(#TxCreatedInFuture);
                };
                let allowedWindow : Nat64 = 60 * 1_000_000_000; // 60 seconds in nanoseconds
                if (now - time.timestamp_nanos > allowedWindow) {
                    return #Err(#TxTooOld { allowed_window_nanos = { duration_nanos = allowedWindow } });
                };
            };
            case null {};
        };

        // Compute sender's account identifier, including subaccount if specified
        let fromAccountId = toAccountId(msg.caller, args.from_subaccount);
        let fromBalance = switch (accounts.get(fromAccountId)) {
            case null 0; // Non-existent accounts have 0 balance
            case (?value) value;
        };
        let totalCost = args.amount.e8s + args.fee.e8s;

        if (fromBalance < totalCost) {
            return #Err(#InsufficientFunds { balance = { e8s = fromBalance } });
        };

        // Update balances
        if (not debit(fromAccountId, totalCost)) {
            return #Err(#InsufficientFunds { balance = { e8s = fromBalance } });
        };
        ignore credit(args.to, args.amount.e8s);

        nextBlockIndex += 1;
        #Ok(nextBlockIndex - 1)
    };

    public query func account_balance(account : AccountIdentifier) : async Tokens {
        let balance = switch (accounts.get(account)) {
            case null 0; // Consistent: non-existent accounts have 0 balance
            case (?value) value;
        };
        { e8s = balance }
    };

    // Helper functions
    private func debit(accountId : AccountIdentifier, amount : Nat) : Bool {
        switch (accounts.get(accountId)) {
            case null false; // Shouldn’t happen after balance check, but safe
            case (?balance) {
                if (balance >= amount) {
                    accounts.put(accountId, balance - amount);
                    true
                } else {
                    false
                }
            };
        }
    };

    private func credit(accountId : AccountIdentifier, amount : Nat) : Bool {
        let balance = switch (accounts.get(accountId)) {
            case null 0;
            case (?value) value;
        };
        accounts.put(accountId, balance + amount);
        true
    };

    private func toAccountId(principal : Principal, subaccount : ?SubAccount) : AccountIdentifier {
        switch (subaccount) {
            case null { Principal.toText(principal) };
            case (?sa) { Principal.toText(principal) # "-" # sa };
        }
    };
}