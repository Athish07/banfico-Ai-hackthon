package com.banfico.hackathon.mapping;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Turns a transaction into a spending category. Two passes:
 *   1. ISO Merchant Category Code — authoritative when present.
 *   2. Keyword match on merchant / description — catches sandbox rows whose MCC
 *      is a placeholder (the original seeder stamped everything "1711", which is
 *      why every transaction would have landed in a single category).
 *
 * Every "category-wise expenditure insight" in the brief runs through here, so
 * extending these tables to match your seeded merchants is high-value minutes.
 */
@Component
public class CategoryResolver {

    private static final Map<String, String> MCC = Map.ofEntries(
            Map.entry("5411", "Groceries"),
            Map.entry("5422", "Groceries"),
            Map.entry("5451", "Groceries"),
            Map.entry("5499", "Groceries"),
            Map.entry("5812", "Dining"),
            Map.entry("5813", "Dining"),
            Map.entry("5814", "Dining"),
            Map.entry("5541", "Transport"),
            Map.entry("5542", "Transport"),
            Map.entry("4111", "Transport"),
            Map.entry("4121", "Transport"),
            Map.entry("4131", "Transport"),
            Map.entry("4511", "Travel"),
            Map.entry("7011", "Travel"),
            Map.entry("4814", "Bills & Utilities"),
            Map.entry("4816", "Bills & Utilities"),
            Map.entry("4900", "Bills & Utilities"),
            Map.entry("4899", "Subscriptions"),
            Map.entry("5734", "Subscriptions"),
            Map.entry("7997", "Health & Fitness"),
            Map.entry("8062", "Healthcare"),
            Map.entry("5912", "Healthcare"),
            Map.entry("5651", "Shopping"),
            Map.entry("5311", "Shopping"),
            Map.entry("5691", "Shopping"),
            Map.entry("5712", "Home"),
            Map.entry("6011", "Cash & Transfers"),
            Map.entry("6012", "Cash & Transfers"),
            Map.entry("7995", "Gambling"),
            Map.entry("8220", "Education"),
            Map.entry("0000", "Income")
    );

    private record Rule(String category, List<String> keywords) {}

    private static final List<Rule> KEYWORD_RULES = List.of(
            new Rule("Income",            List.of("salary", "payroll", "wages", "refund", "interest", "dividend")),
            new Rule("Housing",           List.of("rent", "mortgage", "council tax")),
            new Rule("Groceries",         List.of("tesco", "sainsbury", "aldi", "lidl", "asda", "waitrose", "co-op", "grocer", "market")),
            new Rule("Dining",            List.of("cafe", "coffee", "restaurant", "pizza", "burger", "kitchen", "pub", "deliveroo", "just eat", "pret", "starbucks", "costa", "dishoom")),
            new Rule("Transport",         List.of("uber", "trainline", "rail", "tfl", "bus", "taxi", "shell", "esso", "petrol", "fuel", "parking")),
            new Rule("Subscriptions",     List.of("netflix", "spotify", "prime", "disney", "adobe", "icloud", "subscription", "membership")),
            new Rule("Bills & Utilities", List.of("water", "gas bill", "british gas", "electric", "energy", "vodafone", "broadband", "utility", "insurance")),
            new Rule("Health & Fitness",  List.of("gym", "puregym", "fitness", "yoga")),
            new Rule("Healthcare",        List.of("pharmacy", "boots", "dental", "clinic", "hospital", "optic")),
            new Rule("Shopping",          List.of("asos", "amazon", "zara", "h&m", "next", "argos", "store", "retail", "harrods", "john lewis")),
            new Rule("Home",              List.of("ikea", "b&q", "homebase", "furnitur")),
            new Rule("Cash & Transfers",  List.of("atm", "cash", "transfer", "withdrawal"))
    );

    public String resolve(String mcc, String merchant, String description) {
        // Keywords win over a placeholder MCC when the text is unambiguous.
        String haystack = ((merchant == null ? "" : merchant) + " "
                + (description == null ? "" : description)).toLowerCase();
        for (Rule rule : KEYWORD_RULES) {
            for (String kw : rule.keywords()) {
                if (haystack.contains(kw)) return rule.category();
            }
        }
        if (mcc != null && MCC.containsKey(mcc.trim())) {
            return MCC.get(mcc.trim());
        }
        return "Other";
    }
}
