"use client";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import Combobox from "./Combobox";

const OPTIONS_WITH_EMPTY = [{ value: "", label: "Not specified" }, ...COUNTRY_OPTIONS];

/**
 * ✅ দেশ বাছাই — খুঁজে বাছা যায় ("Ban" → Bangladesh), মান হয় দেশের Code ("BD")
 * onChange(code) — সরাসরি Code দেয়
 */
const CountrySelect = ({ id, label = "Country", value, onChange, error, hint, allowEmpty = true, className, placeholder = "Search country…" }) => (
  <Combobox
    id={id}
    label={label}
    value={value || ""}
    onChange={onChange}
    options={allowEmpty ? OPTIONS_WITH_EMPTY : COUNTRY_OPTIONS}
    placeholder={placeholder}
    searchPlaceholder="Type a country name or code…"
    emptyText="No country matches"
    error={error}
    hint={hint}
    className={className}
  />
);

export default CountrySelect;
