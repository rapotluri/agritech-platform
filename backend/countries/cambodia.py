# backend/countries/cambodia.py
def normalize_province_name(name: str) -> str:
    """
    Normalize province names for Cambodia by removing special characters,
    spaces, and applying consistent formatting.
    Example: "Kâmpóng Spœ" -> "KampongSpeu"
    """
    special_char_map = {
        "â": "a", "œ": "oe", "é": "e", "è": "e", "ê": "e", "ô": "o", "û": "u", "ç": "c",
        "î": "i", "ï": "i", "à": "a", "ë": "e", "ü": "u", "ù": "u", "ÿ": "y", "ñ": "n",
        "ø": "o", "õ": "o", "Ã": "A", "ã": "a", "É": "E", "È": "E", "À": "A", "Ó": "O",
        "ó": "o", "Ú": "U", "ú": "u", "ß": "ss", "í": "i"
    }

    # Remove special characters using the mapping
    name = "".join([special_char_map.get(char, char) for char in name])

    # Remove spaces and ensure capitalization of words
    name_parts = name.split(" ")
    name = "".join([part.capitalize() for part in name_parts])

    # Manually fix known discrepancies
    manual_corrections = {
        "Kampongspoe": "KampongSpeu",     # Correct to the standard format
        "Phnompenh": "PhnomPenh",
        "Tbongkhmum": "TboungKhmum",
        "Preahvihear": "PreahVihear",
        "Siemreab": "SiemReap",
        "Svayrieng": "SvayRieng"
    }

    # Apply manual corrections if necessary
    return manual_corrections.get(name, name)
