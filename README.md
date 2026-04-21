# 🛡️ UPI Shield: Bridging the "Visual Trust Gap"

**UPI Shield** is a proactive security middleware designed to detect and prevent UPI-based scams before they happen. It acts as an intelligent verification layer that "reads" what the human eye cannot, protecting users from social engineering and QR tampering.

---

## 🚩 The Problem: The Visual Trust Gap
Humans cannot "read" a QR code; we see a random pattern of black and white squares. Scammers exploit this by:
1. **The "Receive Money" Fallacy:** Tricking victims into scanning a "Pay" QR to "receive" a prize/refund.
2. **Brand Mimicry:** Using a display name like "Amazon Support" while the money goes to a personal VPA.
3. **Sticker Overlays:** Pasting a malicious QR over a legitimate merchant's code in physical stores.

---

## ✨ The Solution
UPI Shield uses a **Verification Proxy** backend to analyze transactions in real-time. It decomposes the UPI URI and runs three core security checks:

### 1. Intent Alignment Check
The system asks the user their intent (*Sending* vs. *Receiving*). If a user expects to receive money but the QR contains a `pay` instruction, the app triggers a high-risk alert.

### 2. Mimicry Detection Engine
It cross-references the Payee Name against a **Brand Library**. 
* **Scam:** Name is "Airtel" but VPA is `rahul123@okaxis`.
* **Action:** UPI Shield flags the mismatch instantly.

### 3. The Global Naughty List
A real-time SQL database of blacklisted VPAs reported by the community. If the VPA is a known "Mule Account," the transaction is blocked.

---

## 🛠️ Tech Stack
- **Frontend:** React Native / Flutter (QR Scanner & Intent Selection)
- **Backend:** FastAPI (Python) - The "Security Detective"
- **Database:** SQLite (SQL-based Blacklist & Brand Library)
- **Logic:** Regex-based URI parsing and Risk Scoring algorithms.

---

## 📊 Trust Score Algorithm
We calculate safety using a weighted score:
$$T = (W_i \cdot I) + (W_m \cdot M) + (W_b \cdot B)$$

Where:
- **I:** Intent Mismatch
- **M:** Brand Mimicry
- **B:** Blacklist Status

---

## 🚀 Quick Start (Hackathon Demo)

### 1. Backend Setup
```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload
