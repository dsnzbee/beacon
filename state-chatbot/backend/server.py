from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import re

HOST = "0.0.0.0"
# Railway (and many PaaS) provide the port via the PORT env var.
PORT = int(__import__("os").environ.get("PORT", "8000"))
BASE_DIR = Path(__file__).resolve().parent
DOCUMENTS_DIR = BASE_DIR / "documents"

SUPPORTED_INTENTS = {
    "documents": [
        "document",
        "documents",
        "docs",
        "paper",
        "papers",
        "paperwork",
        "id proof",
        "proof",
        "certificate",
        "certificates",
        "required documents",
        "what should i carry",
    ],
    "shelter": ["shelter", "night stay", "temporary stay", "homeless", "nearby shelter"],
    "food": [
        "food",
        "meal",
        "meals",
        "eat",
        "hungry",
        "ration",
        "ration card",
        "hunger",
        "kitchen",
        "community kitchen",
        "rasoi",
        "feeding",
    ],
    "housing": [
        "housing",
        "home",
        "house",
        "rent",
        "accommodation",
        "jhuggi",
        "slum",
        "rehabilitation",
    ],
    "schemes": ["scheme", "yojana", "benefit", "government", "subsidy", "welfare"],
    "helplines": ["helpline", "helplines", "hotline", "hotlines", "phone", "contact", "number", "call"],
    "medical": [
        "hospital",
        "hospitals",
        "clinic",
        "clinics",
        "medical",
        "doctor",
        "health",
        "healthcare",
        "facility",
        "facilities",
        "emergency care",
        "ambulance",
    ],
    "emergency": [
        "emergency",
        "emergencies",
        "emergency number",
        "emergency numbers",
        "emergency contact",
        "urgent",
        "ambulance",
        "police",
        "women helpline",
        "dial",
    ],
    "legal": ["law", "legal", "rights", "court", "dslsa", "legal aid"],
    "complaints": ["complaint", "complaints", "grievance", "grievances", "public grievance"],
    "offices": [
        "office",
        "offices",
        "portal",
        "portals",
        "e-district",
        "edistrict",
        "social welfare",
        "apply online",
        "welfare portal",
    ],
}

UNSUPPORTED_REPLY = (
    "**Sorry, Beacon cannot help with this request yet.**\n\n"
    "**Right now, I can help with:**\n"
    "- Shelter\n"
    "- Food support\n"
    "- Housing\n"
    "- Government schemes\n"
    "- Helplines and emergency numbers\n"
    "- Hospitals and medical facilities\n"
    "- Legal aid, complaints, and support offices\n"
    "- Required documents\n"
    "- Basic legal information"
)

SECTION_HEADINGS = [
    "Government Schemes",
    "Shelters & Helplines",
    "Hospitals & Medical Facilities",
    "Legal Aid & Support Offices",
    "Food Support",
    "Housing Support",
    "Required Documents",
]

SECTION_HEADING_ALIASES = {
    "government schemes": "Government Schemes",
    "summarize government schemes": "Government Schemes",
    "shelters & helplines": "Shelters & Helplines",
    "shelters and helplines": "Shelters & Helplines",
    "find nearby shelters": "Shelters & Helplines",
    "share shelter rescue helplines": "Shelters & Helplines",
    "hospitals & medical facilities": "Hospitals & Medical Facilities",
    "hospitals and medical facilities": "Hospitals & Medical Facilities",
    "list hospitals and medical facilities": "Hospitals & Medical Facilities",
    "show emergency numbers": "Hospitals & Medical Facilities",
    "legal aid & support offices": "Legal Aid & Support Offices",
    "legal aid and support offices": "Legal Aid & Support Offices",
    "find legal aid and support offices": "Legal Aid & Support Offices",
    "guide complaints and grievances": "Legal Aid & Support Offices",
    "point to e-district and welfare portals": "Legal Aid & Support Offices",
    "explain required documents": "Required Documents",
    "guide food support questions": "Food Support",
    "give housing support steps": "Housing Support",
}

TEXT_REPLACEMENTS = {
    "\u00c3\u0097": "x",
    "\u00e2\u0080\u0099": "'",
    "\u00e2\u0080\u009c": '"',
    "\u00e2\u0080\u009d": '"',
    "\u00e2\u0080\u0093": "-",
    "\u00e2\u0089\u00a5": ">=",
    "\u00e2\u0089\u00a4": "<=",
    "\u00e2\u0082\u00b9": "Rs.",
    "\u00e2\u0080\u00af": " ",
    "\u00d7": "x",
    "\u2011": "-",
    "\u2013": "-",
    "\u2014": "-",
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2265": ">=",
    "\u2264": "<=",
    "\u20b9": "Rs.",
}


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def strip_markdown_text(text):
    text = re.sub(r"^[#>\-\*\s]+", "", text.strip())
    text = text.replace("*", "")
    return clean_text(text)


def normalize_heading(line):
    heading = strip_markdown_text(line).rstrip(":")
    heading_key = re.sub(r"\s+", " ", heading.lower())
    return SECTION_HEADING_ALIASES.get(heading_key)


def normalize_document_text(text):
    try:
        normalized_text = text.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        normalized_text = text

    for bad_text, good_text in TEXT_REPLACEMENTS.items():
        normalized_text = normalized_text.replace(bad_text, good_text)

    return normalized_text


def keyword_matches(text, keyword):
    escaped_keyword = re.escape(keyword.lower())

    if " " in keyword:
        return re.search(rf"\b{escaped_keyword}\b", text) is not None

    return re.search(rf"\b{escaped_keyword}s?\b", text) is not None


def detect_intent(question):
    normalized_question = question.lower()
    intent_scores = {}

    for intent, keywords in SUPPORTED_INTENTS.items():
        intent_scores[intent] = sum(
            2 if " " in keyword else 1
            for keyword in keywords
            if keyword_matches(normalized_question, keyword)
        )

    if intent_scores["documents"] > 0:
        return "documents"

    if intent_scores["complaints"] > 0:
        return "complaints"

    if intent_scores["emergency"] > 0:
        return "emergency"

    best_intent = max(intent_scores, key=intent_scores.get)

    if intent_scores[best_intent] > 0:
        return best_intent

    return "unsupported"


def split_document_sections(raw_text):
    sections = {}
    current_heading = "Overview"
    section_lines = []

    for line in raw_text.splitlines():
        clean_line = line.strip()

        if not clean_line:
            continue

        canonical_heading = normalize_heading(clean_line)

        if canonical_heading:
            if section_lines:
                existing_text = sections.get(current_heading, "")
                section_text = "\n".join(section_lines)
                sections[current_heading] = "\n".join(
                    part for part in [existing_text, section_text] if part
                )

            current_heading = canonical_heading
            section_lines = []
            continue

        section_lines.append(clean_line)

    if section_lines:
        existing_text = sections.get(current_heading, "")
        section_text = "\n".join(section_lines)
        sections[current_heading] = "\n".join(part for part in [existing_text, section_text] if part)

    return sections


def load_location_documents(document_folder):
    safe_folder = re.sub(r"[^a-zA-Z0-9_-]", "", document_folder or "")
    folder_path = DOCUMENTS_DIR / safe_folder

    if not folder_path.exists():
      return []

    documents = []

    for file_path in folder_path.glob("*.txt"):
        raw_text = normalize_document_text(file_path.read_text(encoding="utf-8"))
        documents.append(
            {
                "title": file_path.stem.replace("-", " ").title(),
                "text": clean_text(raw_text),
                "raw_text": raw_text,
                "sections": split_document_sections(raw_text),
            }
        )

    return documents


def score_document(document, question, intent):
    score = 0
    searchable_text = f"{document['title']} {document['text']}".lower()
    question_words = set(re.findall(r"[a-zA-Z]{4,}", question.lower()))

    for word in question_words:
        if word in searchable_text:
            score += 1

    for keyword in SUPPORTED_INTENTS.get(intent, []):
        if keyword_matches(searchable_text, keyword):
            score += 2

    return score


def retrieve_relevant_documents(documents, question, intent):
    ranked_documents = sorted(
        documents,
        key=lambda document: score_document(document, question, intent),
        reverse=True,
    )

    return [document for document in ranked_documents if score_document(document, question, intent) > 0][:3]


def extract_shelters(documents):
    shelters = []

    for item in extract_section_items(documents, "Shelters & Helplines"):
        item_name = item["name"].lower()
        item_details = item["details"].lower()

        if "shelter" not in item_name and "shelter" not in item_details:
            continue

        shelters.append(
            {
                "name": item["name"],
                "area": "See listing details",
                "details": item["details"],
            }
        )

    for document in documents:
        for line in document.get("raw_text", "").splitlines():
            clean_line = strip_markdown_text(line)

            if clean_line.startswith("SHELTER:") and "|" in clean_line:
                parts = [part.strip() for part in clean_line.split("|")]

                if len(parts) < 3:
                    continue

                name = parts[0].replace("SHELTER:", "").strip()
                area = parts[1]
                details = parts[2]

                shelters.append(
                    {
                        "name": name,
                        "area": area,
                        "details": details,
                    }
                )
                continue

            if clean_line.startswith("Night Shelters"):
                shelters.extend(extract_guide_shelters(clean_line))

    unique_shelters = []
    seen_names = set()

    for shelter in shelters:
        normalized_name = shelter["name"].lower()

        if normalized_name in seen_names:
            continue

        seen_names.add(normalized_name)
        unique_shelters.append(shelter)

    return unique_shelters[:5]


def extract_guide_shelters(line):
    shelter_names = [
        "Community Hall, Kalkaji",
        "Kalkaji Mandir Women's Shelter",
        "Kalkaji Mandir Women’s Shelter",
        "Lodhi Road Shelter",
        "Nehru Place",
        "Sunlight Colony",
        "Majnu Ka Tilla",
        "Aruna Colony",
        "Azadpur BVK",
        "Sarai Pipal Thala",
        "Chandni Chowk",
        "Nizamuddin",
        "Regarpura",
        "Karol Bagh",
        "Mori Gate",
        "Chabi Ganj",
        "Kashmere Gate",
    ]
    shelters = []

    for name in shelter_names:
        if name.lower() not in line.lower():
            continue

        details = "DUSIB night shelter. Provides beds, food, and basic night amenities."
        match = re.search(rf"{re.escape(name)}\s*\(([^)]+)\)", line)

        if match:
            details = match.group(1).strip()

        display_name = name if "shelter" in name.lower() else f"{name} Night Shelter"

        shelters.append(
            {
                "name": display_name.replace("Women’s", "Women's"),
                "area": name,
                "details": details,
            }
        )

    return shelters


def extract_section_items(documents, section_name):
    items = []

    for document in documents:
        section_text = document.get("sections", {}).get(section_name, "")

        for line in section_text.splitlines():
            clean_line = line.strip()

            dash_match = re.search(r"\s[-–—]\s", clean_line)
            colon_index = clean_line.find(":")

            if dash_match and (colon_index == -1 or dash_match.start() < colon_index):
                name = clean_line[:dash_match.start()]
                details = clean_line[dash_match.end():]
            elif ":" in clean_line:
                name, details = clean_line.split(":", 1)
            else:
                continue

            name = strip_markdown_text(name)
            details = clean_text(details)

            if name.lower() == "sources":
                continue

            if name and details:
                items.append(
                    {
                        "name": name,
                        "details": details,
                        "source": document["title"],
                    }
                )

    return items


def find_items_by_name(documents, section_names, name_keywords):
    matches = []

    for section_name in section_names:
        for item in extract_section_items(documents, section_name):
            searchable_name = item["name"].lower()

            if any(keyword in searchable_name for keyword in name_keywords):
                matches.append(item)

    return matches


def format_items(items, limit=None):
    formatted_items = []
    selected_items = items[:limit] if limit else items

    for index, item in enumerate(selected_items, start=1):
        formatted_items.append(
            f"{index}. **{item['name']}**\n"
            f"{item['details']}"
        )

    return "\n\n".join(formatted_items)


def create_section_answer(title, state, location, items, next_steps):
    if not items:
        return (
            f"**{title} for {location}, {state}**\n\n"
            "I could not find a clear local listing for this yet.\n\n"
            "Try asking with more details, such as a hospital name, helpline, office, complaint, or scheme."
        )

    return (
        f"**{title} for {location}, {state}**\n\n"
        + format_items(items)
        + "\n\n**What to do next:**\n"
        + next_steps
    )


def create_schemes_answer(state, location, documents):
    schemes = extract_section_items(documents, "Government Schemes")

    if not schemes:
        return create_general_answer(state, location, "schemes", documents)

    scheme_lines = []

    for index, scheme in enumerate(schemes[:4], start=1):
        scheme_lines.append(
            f"{index}. **{scheme['name']}**\n"
            f"{scheme['details']}"
        )

    return (
        f"**Government schemes for {location}, {state}**\n\n"
        + "\n\n".join(scheme_lines)
        + "\n\n**What to do next:**\n"
        "1. Check the eligibility line for age, income, disability, or family status.\n"
        "2. Keep ID proof, address proof, and income proof ready if available.\n"
        "3. Apply through the local Social Welfare Office or the e-District portal where listed."
    )


def create_helplines_answer(state, location, documents):
    helplines = []
    helplines.extend(
        find_items_by_name(
            documents,
            ["Shelters & Helplines"],
            ["control room", "hotline"],
        )
    )
    helplines.extend(
        find_items_by_name(
            documents,
            ["Hospitals & Medical Facilities"],
            ["general emergencies"],
        )
    )
    helplines.extend(
        find_items_by_name(
            documents,
            ["Legal Aid & Support Offices"],
            ["complaint", "helpline"],
        )
    )

    return create_section_answer(
        "Helplines",
        state,
        location,
        helplines,
        "1. Use emergency numbers first when someone is in immediate danger.\n"
        "2. For night shelter rescue, use the DUSIB or Rain Basera contact.\n"
        "3. For complaints or women's safety issues, use the listed complaint helplines.",
    )


def create_medical_answer(state, location, documents):
    medical_items = [
        item
        for item in extract_section_items(documents, "Hospitals & Medical Facilities")
        if "general emergencies" not in item["name"].lower()
    ]

    return create_section_answer(
        "Hospitals and medical facilities",
        state,
        location,
        medical_items,
        "1. For immediate medical emergencies, call 102 or 108 first.\n"
        "2. Use the hospital emergency number before travelling if possible.\n"
        "3. Carry any ID, medical papers, prescriptions, or discharge summaries you have.",
    )


def create_emergency_answer(state, location, documents):
    emergency_items = []
    emergency_items.extend(
        find_items_by_name(
            documents,
            ["Hospitals & Medical Facilities"],
            ["general emergencies"],
        )
    )
    emergency_items.extend(
        find_items_by_name(
            documents,
            ["Shelters & Helplines"],
            ["control room", "hotline"],
        )
    )
    emergency_items.extend(
        find_items_by_name(
            documents,
            ["Legal Aid & Support Offices"],
            ["complaint", "helpline"],
        )
    )

    return create_section_answer(
        "Emergency contacts",
        state,
        location,
        emergency_items,
        "1. If there is immediate danger, dial 112.\n"
        "2. For ambulance help, call 102 or 108.\n"
        "3. For shelter rescue or complaints, use the listed local helplines.",
    )


def create_legal_answer(state, location, documents):
    legal_items = extract_section_items(documents, "Legal Aid & Support Offices")

    return create_section_answer(
        "Legal aid and support",
        state,
        location,
        legal_items,
        "1. Contact DSLSA for free legal aid if eligible.\n"
        "2. For certificates or welfare applications, use the e-District portal.\n"
        "3. For urgent danger or police help, dial 112.",
    )


def create_offices_answer(state, location, documents):
    office_items = [
        item
        for item in extract_section_items(documents, "Legal Aid & Support Offices")
        if any(
            keyword in item["name"].lower()
            for keyword in ["office", "portal", "authority", "social welfare", "e-district"]
        )
    ]

    return create_section_answer(
        "Support offices and portals",
        state,
        location,
        office_items,
        "1. Use the Social Welfare Office for scheme applications or grievances.\n"
        "2. Use e-District for certificates and online welfare applications.\n"
        "3. Carry ID proof, address proof, and any existing application papers.",
    )


def create_complaints_answer(state, location, documents):
    complaint_items = find_items_by_name(
        documents,
        ["Legal Aid & Support Offices"],
        ["complaint", "helpline"],
    )

    return create_section_answer(
        "Complaint and grievance support",
        state,
        location,
        complaint_items,
        "1. Use the public grievance portal or local police station for complaints.\n"
        "2. For women's issues, contact the Delhi Commission for Women helpline.\n"
        "3. If someone is in immediate danger, dial 112.",
    )


def create_food_answer(state, location, documents):
    food_items = extract_section_items(documents, "Food Support")

    if not food_items:
        return create_general_answer(state, location, "food", documents)

    return create_section_answer(
        "Food support",
        state,
        location,
        food_items,
        "1. Ask first about ration eligibility, community kitchens, or local food counters.\n"
        "2. Keep Aadhaar, address proof, or any ration card details ready if available.\n"
        "3. If you need food urgently, ask the nearest shelter, NGO, or district help desk for same-day options.",
    )


def create_housing_answer(state, location, documents):
    housing_items = extract_section_items(documents, "Housing Support")

    if not housing_items:
        return create_general_answer(state, location, "housing", documents)

    return create_section_answer(
        "Housing support",
        state,
        location,
        housing_items,
        "1. For immediate safety, use the nearest DUSIB night shelter first.\n"
        "2. For longer-term support, ask DUSIB, DDA, or the district welfare office about eligibility.\n"
        "3. Carry ID proof, address proof, and any shelter receipt or application paper you have.",
    )


def create_documents_answer(state, location, question, documents):
    normalized_question = question.lower()
    topic = "this service"

    for possible_topic in [
        "shelter",
        "housing",
        "food",
        "schemes",
        "helplines",
        "hospital",
        "medical",
        "emergency",
        "legal",
        "complaint",
    ]:
        if possible_topic in normalized_question:
            topic = possible_topic
            break

    local_notes = []
    legal_items = extract_section_items(documents, "Legal Aid & Support Offices")

    for item in legal_items:
        if any(keyword in item["details"].lower() for keyword in ["apply", "certificate", "scheme"]):
            local_notes.append(f"- **{item['name']}**: {item['details']}")

    if not local_notes:
        notes = retrieve_relevant_documents(documents, question, "documents")

        if notes:
            local_notes.append(f"- **{notes[0]['title']}**: {notes[0]['text'][:180]}")

    note_text = ""

    if local_notes:
        note_text = "\n\n**Local document support:**\n" + "\n".join(local_notes[:3])

    return (
        f"**Required documents for {topic}**\n\n"
        "1. ID proof, such as Aadhaar, voter ID, or any government ID.\n"
        "2. Address proof, if available.\n"
        "3. Income proof or certificate, if the scheme asks for it.\n"
        "4. Any previous application receipt or case paper.\n\n"
        "**If documents are missing:**\n"
        "Ask the help desk about temporary registration or document support."
        + note_text
    )


def create_shelter_answer(state, location, documents):
    shelters = extract_shelters(documents)
    shelter_helplines = find_items_by_name(
        documents,
        ["Shelters & Helplines"],
        ["control room", "hotline"],
    )

    if not shelters:
        return (
            f"**Shelter options for {location}, {state}**\n\n"
            "No specific shelter locations are listed yet.\n\n"
            "**Next steps:**\n"
            "1. Visit the nearest district help desk.\n"
            "2. Ask for the closest night shelter.\n"
            "3. Carry ID proof if you have it."
        )

    shelter_lines = []

    for index, shelter in enumerate(shelters, start=1):
        shelter_lines.append(
            f"{index}. **{shelter['name']}**\n"
            f"Area: {shelter['area']}\n"
            f"Note: {shelter['details']}"
        )

    helpline_text = ""

    if shelter_helplines:
        helpline_text = "\n\n**Shelter helpline:**\n" + format_items(shelter_helplines)

    return (
        f"**Nearby shelter options for {location}, {state}**\n\n"
        + "\n\n".join(shelter_lines)
        + helpline_text
        + "\n\n**What to do next:**\n"
        "1. Call or visit the closest shelter first.\n"
        "2. Carry ID proof if available.\n"
        "3. If you do not have documents, ask for temporary registration help."
    )


def create_general_answer(state, location, intent, documents):
    relevant_documents = retrieve_relevant_documents(documents, intent, intent)

    if not relevant_documents:
        return (
            f"**{intent.title()} support for {location}, {state}**\n\n"
            f"I could not find a clear match for this {intent} question yet.\n\n"
            "Try asking with more details."
        )

    source_lines = []

    for document in relevant_documents:
        source_lines.append(f"- {document['title']}: {document['text'][:160]}")

    return (
        f"**{intent.title()} support for {location}, {state}**\n\n"
        "**Next steps:**\n"
        "1. Keep ID proof and address proof ready.\n"
        "2. Visit the nearest help desk or office.\n"
        "3. Ask a follow-up for eligibility or documents.\n\n"
        "**Document notes:**\n"
        + "\n".join(source_lines)
    )


def create_answer(question, state, location, document_folder):
    intent = detect_intent(question)

    if intent == "unsupported":
        return {
            "answer": UNSUPPORTED_REPLY,
            "intent": intent,
            "sources": [],
        }

    documents = load_location_documents(document_folder)

    if not documents:
        return {
            "answer": (
                f"**{intent.title()} support for {location}, {state}**\n\n"
                "No local documents have been added for this province yet.\n\n"
                "Add PDF-extracted text or text files to the matching backend documents folder."
            ),
            "intent": intent,
            "sources": [],
        }

    if intent == "shelter":
        return {
            "answer": create_shelter_answer(state, location, documents),
            "intent": intent,
            "sources": [document["title"] for document in documents],
        }

    if intent == "documents":
        return {
            "answer": create_documents_answer(state, location, question, documents),
            "intent": intent,
            "sources": [document["title"] for document in documents],
        }

    if intent == "schemes":
        return {
            "answer": create_schemes_answer(state, location, documents),
            "intent": intent,
            "sources": [document["title"] for document in documents],
        }

    intent_answer_builders = {
        "helplines": create_helplines_answer,
        "food": create_food_answer,
        "housing": create_housing_answer,
        "medical": create_medical_answer,
        "emergency": create_emergency_answer,
        "legal": create_legal_answer,
        "offices": create_offices_answer,
        "complaints": create_complaints_answer,
    }

    if intent in intent_answer_builders:
        return {
            "answer": intent_answer_builders[intent](state, location, documents),
            "intent": intent,
            "sources": [document["title"] for document in documents],
        }

    relevant_documents = retrieve_relevant_documents(documents, question, intent)

    return {
        "answer": create_general_answer(state, location, intent, documents),
        "intent": intent,
        "sources": [document["title"] for document in relevant_documents],
    }


class ChatHandler(BaseHTTPRequestHandler):
    def send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(200, {"ok": True})

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json(200, {"ok": True, "service": "beacon-python-ai"})
            return

        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_json(404, {"error": "Not found"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            data = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        question = clean_text(data.get("question", ""))
        state = clean_text(data.get("state", "Delhi"))
        location = clean_text(data.get("location", "Delhi"))
        document_folder = clean_text(data.get("documentFolder", ""))

        if not question:
            self.send_json(400, {"error": "Question is required"})
            return

        self.send_json(200, create_answer(question, state, location, document_folder))


def run_server():
    server = HTTPServer((HOST, PORT), ChatHandler)
    print(f"Beacon Python AI server running on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
