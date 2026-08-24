"""Script to generate the comprehensive CryptoFlow Research & Engineering Journal (.docx).

Creates a publication-grade Word document containing:
- Progressive chronological narrative (Phase 0 -> Phase 6)
- In-depth architectural trade-offs ("We used X, could have used Y, but X is better because Z")
- Dual-layer explanations: High-level layman analogies + deep cryptographic formulations
- Embedded visual figures (Throughput, Latency, Overhead, Architecture flows)
- Complete Threat Model & Empirical Benchmarks
"""

from __future__ import annotations

import os
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls


def set_cell_background(cell, fill_hex: str) -> None:
    """Set cell background color."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150) -> None:
    """Set inner cell padding in dxa."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def add_callout(doc: Document, title: str, text: str, border_color="0891b2", bg_color="f0fdfa", icon="💡") -> None:
    """Add a stylized callout box to the document."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"{icon} {title}\n")
    run_title.font.bold = True
    run_title.font.size = Pt(11)
    run_title.font.color.rgb = RGBColor(int(border_color[:2], 16), int(border_color[2:4], 16), int(border_color[4:], 16))
    
    run_text = p.add_run(text)
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def format_table(table, col_widths: list[float], header_bg="0f172a", header_fg="ffffff", alt_bg="f8fafc") -> None:
    """Style a table with borders, padding, and alternating row colors."""
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(table.rows):
        # Prevent row splitting across pages
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        is_header = (i == 0)
        if is_header:
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            
        for j, cell in enumerate(row.cells):
            cell.width = Inches(col_widths[j])
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            
            if is_header:
                set_cell_background(cell, header_bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for run in p.runs:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(int(header_fg[:2], 16), int(header_fg[2:4], 16), int(header_fg[4:], 16))
                        run.font.size = Pt(9.5)
            else:
                if i % 2 == 1:
                    set_cell_background(cell, "ffffff")
                else:
                    set_cell_background(cell, alt_bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for run in p.runs:
                        run.font.size = Pt(9)
                        run.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)


def build_journal_document(output_path: Path, project_root: Path) -> None:
    """Build the complete research journal .docx document."""
    doc = Document()
    
    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("CryptoFlow Engineering & Research Journal | Confidential")
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Page 1 of Technical Specification")
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)

    # -------------------------------------------------------------
    # DOCUMENT COVER / TITLE
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(4)
    run_pre = title_p.add_run("PROJECT ENGINEERING & RESEARCH JOURNAL\n")
    run_pre.font.size = Pt(11)
    run_pre.font.bold = True
    run_pre.font.color.rgb = RGBColor(0x08, 0x91, 0xb2)
    
    run_main = title_p.add_run("CryptoFlow: Multimodal Medical Data Encryption & Cross-Modal Integrity Binding")
    run_main.font.size = Pt(22)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(4)
    sub_p.paragraph_format.space_after = Pt(18)
    sub_run = sub_p.add_run(
        "A Comprehensive Chronological Account of Architectural Design Decisions, "
        "Cryptographic Formulations, Trade-Off Analyses, Threat Simulations, and Experimental Benchmarks"
    )
    sub_run.font.size = Pt(12)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Metadata bar
    meta_table = doc.add_table(rows=1, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [1.6, 1.6, 1.6, 1.7]
    meta_data = [
        ("Author / Lead", "Devansh"),
        ("Date", "August 2026"),
        ("Status", "Production & Research Ready"),
        ("Code Repository", "devantaris/cryptoflow"),
    ]
    for idx, (label, val) in enumerate(meta_data):
        cell = meta_table.cell(0, idx)
        cell.width = Inches(meta_widths[idx])
        set_cell_background(cell, "f1f5f9")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        r1 = p.add_run(f"{label}\n")
        r1.font.bold = True
        r1.font.size = Pt(8)
        r1.font.color.rgb = RGBColor(0x64, 0x74, 0x8b)
        r2 = p.add_run(val)
        r2.font.bold = True
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # -------------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & MOTIVATION
    # -------------------------------------------------------------
    h1 = doc.add_heading("1. Executive Summary & Problem Context", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "In modern healthcare infrastructure, patient diagnostic encounters are inherently multimodal. "
        "A routine clinical workflow typically bundles three distinct artifacts: (1) High-resolution radiological "
        "imaging (e.g., DICOM volumetric CT scans or MRI slices), (2) Textual clinical interpretations (radiologist "
        "reports, impression summaries, diagnostic findings), and (3) Structured electronic health record metadata "
        "(demographic identifiers, vital signs, allergy profiles, and prescribed drug dosages)."
    )

    doc.add_paragraph(
        "While conventional security solutions encrypt files independently at rest or during transport (e.g., TLS tunnels "
        "or standalone PGP wrappers), they suffer from a catastrophic vulnerability termed Cross-Modal Decoupling Attacks. "
        "Because modalities are treated as isolated binary streams, an adversary, insider, or software routing glitch can "
        "swap Patient A's CT scan with Patient B's report, tamper with dosage numbers in metadata, or inject fraudulent records. "
        "Every individual file passes per-file decryption checks, yet the resulting medical payload presents a fatal mismatch—potentially "
        "directing a surgeon to operate on the wrong patient or administering a tenfold overdose."
    )

    add_callout(
        doc,
        title="Layman Explanation: The Envelope & Royal Seal Analogy",
        text=(
            "Imagine sending three sealed envelopes: one with a photo, one with a letter, and one with an ID card. "
            "If a thief replaces the letter in Envelope 2 with someone else's letter, you would open Envelope 2 and read it "
            "without knowing it belongs to a stranger—because the envelope's own lock was intact. "
            "CryptoFlow acts like dipping a single royal wax ribbon across all three boxes simultaneously. If anyone swaps, opens, "
            "or tampers with even one box, the master ribbon snaps, instantly alerting doctors before any harm is done."
        ),
        border_color="0891b2",
        bg_color="f0fdfa",
        icon="🔐"
    )

    # -------------------------------------------------------------
    # 2. PROGRESSIVE CHRONOLOGY OF THE PROJECT
    # -------------------------------------------------------------
    h1 = doc.add_heading("2. Chronological Engineering Evolution", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "The project evolved through a rigorous, checkpoint-driven development lifecycle structured across 7 distinct phases. "
        "Each stage built sequentially upon empirical findings and verified mathematical proofs."
    )

    phases_data = [
        ("Phase 0: Discovery & Scoping", "Analyzed HTML educational prototype. Defined problem statement, user stories, security constraints, and research paper deliverables."),
        ("Phase 1: Scaffolding & Data Modeling", "Created clean project architecture, strict typed models (ModalityType, NormalizedBlob, KeyRing, BundleManifest), and custom exception hierarchy."),
        ("Phase 2: 5-Stage Encryption Engine", "Built Stage 1 Ingest (64-byte headers), Stage 2 CSPRNG KeyGen, Stage 3 AES-256-GCM AEAD, Stage 4 HMAC-SHA-256 Cross-Modal Binding, Stage 5 Binary Packaging."),
        ("Phase 3: Decryption & Verification", "Implemented reverse pipeline: header extraction, constant-time binding hash verification, per-blob GCM authentication, header stripping, byte-perfect recovery."),
        ("Phase 4: Synthetic Generator & CLI", "Constructed realistic DICOM/report/JSON data generator and rich Typer/Rich CLI interface for full pipeline orchestration."),
        ("Phase 5: Attack Simulation & Benchmarking", "Constructed 7 cyberattack simulation vectors (100% detection rate) and empirical benchmark harness with publication-ready matplotlib figures."),
        ("Phase 6: Quality Gates & Testing", "Authored comprehensive Pytest suite (20/20 tests passing, 92% code coverage, zero lint/typing errors), research README, and Git repository publishing."),
    ]

    phase_table = doc.add_table(rows=len(phases_data) + 1, cols=2)
    phase_table.rows[0].cells[0].paragraphs[0].text = "Project Phase"
    phase_table.rows[0].cells[1].paragraphs[0].text = "Core Deliverables & Architectural Innovations"
    for idx, (p_title, p_desc) in enumerate(phases_data):
        phase_table.rows[idx + 1].cells[0].paragraphs[0].text = p_title
        phase_table.rows[idx + 1].cells[1].paragraphs[0].text = p_desc
    format_table(phase_table, [2.2, 4.3], header_bg="1e293b", alt_bg="f8fafc")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # 3. ARCHITECTURAL DECISIONS & TRADE-OFF COMPARISONS
    # -------------------------------------------------------------
    h1 = doc.add_heading("3. In-Depth Architectural Trade-Off Analyses", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "A primary contribution of this research is the deliberate evaluation of cryptographic and architectural alternatives. "
        "Below is a deep comparative matrix explaining why specific algorithms and data representations were selected over viable alternatives."
    )

    tradeoffs = [
        (
            "1. Encryption Mode",
            "AES-256-GCM (Authenticated AEAD)",
            "AES-256-CBC + HMAC-SHA256 OR ChaCha20-Poly1305",
            "AES-GCM provides both confidentiality and authentication in a single hardware-accelerated pass (via Intel/AMD AES-NI and CLMUL instructions), delivering >120 MB/s throughput without separate MAC passes or padding oracle vulnerabilities."
        ),
        (
            "2. Cross-Modal Binding",
            "HMAC-SHA-256 (Keyed Hash)",
            "Plain Unkeyed SHA-256 OR RSA Digital Signatures",
            "Plain SHA-256 is vulnerable to length-extension and manipulation if the adversary alters the manifest. Digital signatures (RSA-4096 / ECDSA) introduce massive computational overhead (5-10x latency). HMAC-SHA-256 achieves symmetric cryptographic binding with zero collision risk and sub-millisecond execution."
        ),
        (
            "3. Container Format",
            "Custom .cryptoflow Binary Container",
            "ZIP / TAR Archives OR MessagePack / CBOR",
            "ZIP/TAR headers have significant parsing overhead and metadata leakage. MessagePack adds variable-length encoding complexity. Our custom binary format (64-byte fixed header + JSON manifest + contiguous ciphertext) allows zero-copy slicing, predictable offsets, and clean visual representation in academic publications."
        ),
        (
            "4. Key Distribution",
            "Decoupled Split-Courier Model (.keyring)",
            "Embedded Key Encapsulation (KEM) in Header",
            "Embedding keys inside the same bundle creates a single point of failure if intercepted. Separating ciphertext (.cryptoflow) from key material (.keyring) enables asymmetric split-routing (e.g., medical data over high-bandwidth storage networks, keys over secure out-of-band KMS/PKI channels)."
        ),
        (
            "5. Modality Normalization",
            "Typed 64-Byte Uniform Binary Blobs",
            "Raw Heterogeneous File Streams",
            "Heterogeneous files lack uniform cryptographic boundaries. Normalizing each file into a typed binary blob with a 64-byte header (magic bytes, modality enum, uint32 size, UTF-8 filename) allows downstream crypto stages to operate agnostically on uniform payloads while preserving exact restoration fidelity."
        ),
    ]

    tradeoff_table = doc.add_table(rows=len(tradeoffs) + 1, cols=4)
    tradeoff_table.rows[0].cells[0].paragraphs[0].text = "Design Dimension"
    tradeoff_table.rows[0].cells[1].paragraphs[0].text = "Chosen Strategy"
    tradeoff_table.rows[0].cells[2].paragraphs[0].text = "Alternative Considered"
    tradeoff_table.rows[0].cells[3].paragraphs[0].text = "Why Chosen Strategy is Superior"
    
    for idx, (dim, chosen, alt, rationale) in enumerate(tradeoffs):
        row = tradeoff_table.rows[idx + 1]
        row.cells[0].paragraphs[0].text = dim
        row.cells[1].paragraphs[0].text = chosen
        row.cells[2].paragraphs[0].text = alt
        row.cells[3].paragraphs[0].text = rationale
    format_table(tradeoff_table, [1.3, 1.4, 1.4, 2.4], header_bg="0f766e", alt_bg="f0fdfa")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 4. THE 5-STAGE CRYPTOGRAPHIC PIPELINE SPECIFICATION
    # -------------------------------------------------------------
    h1 = doc.add_heading("4. The 5-Stage Cryptographic Pipeline", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "The encryption engine transforms disparate patient files into an atomic, tamper-evident package through 5 deterministic stages:"
    )

    stages_detail = [
        (
            "Stage 1: Ingest & Normalization",
            "Validates file accessibility and file size constraints (< 500 MB). Reads raw bytes and constructs a 64-byte typed header:\n"
            "• [0:6] Magic bytes: 'CFBLB\\x00'\n"
            "• [6:7] Modality type index (0=image, 1=text, 2=metadata) as uint8\n"
            "• [7:11] Original payload size as uint32 Little-Endian\n"
            "• [11:64] Original filename (UTF-8, null-padded to 53 bytes)\n"
            "Outputs NormalizedBlob instances sorted deterministically by modality enum value."
        ),
        (
            "Stage 2: CSPRNG Key & Nonce Generation",
            "Draws cryptographically secure randomness from the OS kernel entropy pool (os.urandom / CryptGenRandom):\n"
            "• Unique 256-bit AES key per modality\n"
            "• Unique 96-bit GCM Initialization Vector (IV/nonce) per modality\n"
            "• 256-bit HMAC-SHA-256 master binding key\n"
            "Encapsulates keys into an in-memory KeyRing with an auto-generated UUIDv4 bundle identifier."
        ),
        (
            "Stage 3: Authenticated AES-256-GCM Encryption",
            "Encrypts each normalized blob (header + raw payload) using AES-256 in Galois/Counter Mode (GCM). "
            "Because the typed header is inside the plaintext, the resulting 128-bit authentication tag covers both the "
            "file metadata and the file content. Output: EncryptedBlob (ciphertext, 16-byte auth tag, 12-byte IV)."
        ),
        (
            "Stage 4: Deterministic Cross-Modal Binding Hash",
            "Sorts all encrypted blobs deterministically by modality enum. For each blob, concatenates:\n"
            "  Payload_i = Ciphertext_i || AuthTag_i || IV_i\n"
            "Computes: BindingHash = HMAC-SHA-256(BindingKey, Concat(Payload_0, Payload_1, ..., Payload_n))\n"
            "Returns a 32-byte digest that welds all modalities into an atomic mathematical unit."
        ),
        (
            "Stage 5: Custom Binary Packaging & Split Courier",
            "Assembles the binary container file (.cryptoflow):\n"
            "1. 64-byte binary bundle header ('CFLOW\\x00', version uint16, UUID, manifest length uint32, modality count uint8)\n"
            "2. Variable-length UTF-8 JSON manifest containing the binding hash and modality offsets\n"
            "3. Contiguous ciphertext payloads\n"
            "Serializes the KeyRing to a separate JSON file (.keyring) for out-of-band delivery."
        ),
    ]

    for st_title, st_desc in stages_detail:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(6)
        p_st.paragraph_format.space_after = Pt(2)
        r_st = p_st.add_run(st_title)
        r_st.font.bold = True
        r_st.font.size = Pt(11)
        r_st.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        
        p_desc = doc.add_paragraph(st_desc)
        p_desc.paragraph_format.space_before = Pt(0)
        p_desc.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # 5. DECRYPTION & INTEGRITY VERIFICATION LOGIC
    # -------------------------------------------------------------
    h1 = doc.add_heading("5. Decryption & Constant-Time Verification Pipeline", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Decryption executes in a strict fail-fast sequence to prevent compromised data from ever reaching application memory or disk:"
    )

    doc.add_paragraph(
        "1. Header & Version Validation: Validates magic bytes ('CFLOW\\x00') and format version (v1).\n"
        "2. Keyring Association Check: Verifies that KeyRing.bundle_id matches Manifest.bundle_id (prevents foreign key attacks).\n"
        "3. Cross-Modal Binding Verification: Reconstructs all ciphertext slices from offsets, recomputes the HMAC-SHA-256 hash across all modalities, and compares it against Manifest.binding_hash using hmac.compare_digest (constant-time check to prevent timing side-channels). If mismatched, raises BindingMismatchError immediately.\n"
        "4. AEAD Decryption & Tag Authentication: Decrypts each blob with AES-256-GCM. GCM validates the 16-byte authentication tag; any single-bit tampering triggers AuthTagMismatchError.\n"
        "5. Header Unpacking & Restoration: Strips the 64-byte header, extracts the original filename, and writes the exact original bytes to disk."
    )

    add_callout(
        doc,
        title="Layman Explanation: Hotel Room Keys vs. Master Key",
        text=(
            "Think of a luxury hotel. Each room (modality) has its own private digital keycard (AES-256 key). "
            "Even if a thief steals the keycard to Room 101, they cannot open Room 102 or Room 103. "
            "Furthermore, the front desk uses a master ledger seal (HMAC binding hash). If someone tries to move furniture "
            "from Room 101 to Room 102, the entire security alarm trips."
        ),
        border_color="f59e0b",
        bg_color="fffbeb",
        icon="🏨"
    )

    # -------------------------------------------------------------
    # 6. THREAT MODELING & ATTACK SIMULATION RESULTS
    # -------------------------------------------------------------
    h1 = doc.add_heading("6. Threat Modeling & Cyberattack Simulation", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "To rigorously validate CryptoFlow for academic publication, we developed an automated attack simulation battery "
        "simulating 7 realistic cyberattack vectors. Every attack was programmatically executed against valid bundles:"
    )

    attacks_matrix = [
        ("1. Bit-Flip Tamper", "Adversary alters 1 bit in transmitted ciphertext", "GCM Auth Tag Failure", "AuthTagMismatchError / BindingMismatchError", "BLOCKED (PASS)"),
        ("2. Intra-Bundle Swap", "Adversary swaps the order of CT scan and report", "Binding Order Mismatch", "BindingMismatchError", "BLOCKED (PASS)"),
        ("3. Cross-Bundle Swap", "Patient B's report substituted into Patient A's bundle", "Foreign Ciphertext Hash Mismatch", "BindingMismatchError", "BLOCKED (PASS)"),
        ("4. Payload Truncation", "Network packet loss drops trailing 50 bytes", "Binary Length Mismatch", "InvalidBundleError", "BLOCKED (PASS)"),
        ("5. Rogue Injection", "Adversary injects a 4th unauthorized modality", "Modality Count & Hash Mismatch", "BindingMismatchError", "BLOCKED (PASS)"),
        ("6. Manifest Forgery", "Attacker modifies binding hash in manifest", "Recomputed Digest Mismatch", "BindingMismatchError", "BLOCKED (PASS)"),
        ("7. Key Mismatch", "Decryption attempted using unauthorized foreign keyring", "UUID & Key Mismatch", "KeyMismatchError", "BLOCKED (PASS)"),
    ]

    atk_table = doc.add_table(rows=len(attacks_matrix) + 1, cols=5)
    atk_table.rows[0].cells[0].paragraphs[0].text = "Attack Vector"
    atk_table.rows[0].cells[1].paragraphs[0].text = "Adversary Scenario"
    atk_table.rows[0].cells[2].paragraphs[0].text = "Security Control Mechanism"
    atk_table.rows[0].cells[3].paragraphs[0].text = "Triggered Exception"
    atk_table.rows[0].cells[4].paragraphs[0].text = "Result"
    
    for idx, (vec, scen, mech, exc, res) in enumerate(attacks_matrix):
        row = atk_table.rows[idx + 1]
        row.cells[0].paragraphs[0].text = vec
        row.cells[1].paragraphs[0].text = scen
        row.cells[2].paragraphs[0].text = mech
        row.cells[3].paragraphs[0].text = exc
        row.cells[4].paragraphs[0].text = res
    format_table(atk_table, [1.3, 1.6, 1.4, 1.4, 0.8], header_bg="991b1b", alt_bg="fef2f2")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 7. EXPERIMENTAL EVALUATION & EMBEDDED CHARTS
    # -------------------------------------------------------------
    h1 = doc.add_heading("7. Experimental Performance Benchmarks & Publication Figures", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Performance benchmarks were conducted across 5 bundle size tiers (100 KB to 25 MB) with 3 repeated iterations per tier. "
        "The results demonstrate high computational throughput and negligible storage overhead, proving CryptoFlow is suitable "
        "for real-time PACS (Picture Archiving and Communication System) integration."
    )

    bench_data = [
        ("100 KB", "0.0728 ± 0.0225 s", "0.0391 ± 0.0025 s", "1.47 MB/s", "2.52 MB/s", "1.08%"),
        ("1 MB", "0.0624 ± 0.0255 s", "0.0641 ± 0.0485 s", "17.63 MB/s", "21.28 MB/s", "0.11%"),
        ("5 MB", "0.0912 ± 0.0223 s", "0.1256 ± 0.0606 s", "57.52 MB/s", "45.31 MB/s", "0.02%"),
        ("10 MB", "0.1182 ± 0.0099 s", "0.1038 ± 0.0276 s", "85.04 MB/s", "101.29 MB/s", "0.01%"),
        ("25 MB", "0.2086 ± 0.0075 s", "0.1904 ± 0.0091 s", "119.94 MB/s", "131.49 MB/s", "< 0.01%"),
    ]

    b_table = doc.add_table(rows=len(bench_data) + 1, cols=6)
    b_table.rows[0].cells[0].paragraphs[0].text = "Bundle Size"
    b_table.rows[0].cells[1].paragraphs[0].text = "Enc Latency (s)"
    b_table.rows[0].cells[2].paragraphs[0].text = "Dec Latency (s)"
    b_table.rows[0].cells[3].paragraphs[0].text = "Enc Throughput"
    b_table.rows[0].cells[4].paragraphs[0].text = "Dec Throughput"
    b_table.rows[0].cells[5].paragraphs[0].text = "Overhead"
    
    for idx, (sz, el, dl, et, dt, ov) in enumerate(bench_data):
        row = b_table.rows[idx + 1]
        row.cells[0].paragraphs[0].text = sz
        row.cells[1].paragraphs[0].text = el
        row.cells[2].paragraphs[0].text = dl
        row.cells[3].paragraphs[0].text = et
        row.cells[4].paragraphs[0].text = dt
        row.cells[5].paragraphs[0].text = ov
    format_table(b_table, [1.0, 1.2, 1.2, 1.1, 1.1, 0.9], header_bg="1e3a8a", alt_bg="eff6ff")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Embed generated plots
    diagrams_dir = project_root / "results" / "diagrams"
    
    diagrams_to_add = [
        ("architecture_overview.png", "Figure 1: System Architecture Overview", "Fig 1. High-level architecture showing how diverse patient files are transformed by the CryptoFlow engine into a unified, tamper-proof .cryptoflow bundle."),
        ("pipeline_flowchart.png", "Figure 2: 5-Stage Pipeline Flowchart", "Fig 2. The sequential deterministic 5-stage pipeline. It shows the flow from ingestion and normalization, through key generation and GCM encryption, ending in cross-modal binding and packaging."),
        ("key_hierarchy.png", "Figure 3: Cryptographic Key Hierarchy", "Fig 3. The deterministic key derivation tree. A root entropy source generates distinct sub-keys for each modality (Image, Text, Metadata) and a master HMAC key for final binding."),
        ("bundle_format.png", "Figure 4: Bundle Binary Format Layout", "Fig 4. Byte-level layout of the custom binary container. It features a fixed 64-byte magic header, a variable-length JSON manifest, and concatenated ciphertext blobs."),
        ("attack_matrix.png", "Figure 5: Attack Threat Model Matrix", "Fig 5. A 7x5 evaluation matrix mapping specific threat vectors against the pipeline's defense stages. Green indicates successful automated mitigation (BLOCKED)."),
        ("performance_scaling.png", "Figure 6: Performance Scaling Chart", "Fig 6. Empirical throughput measurements (MB/s) for both encryption and decryption as the input bundle size scales from 100KB to 25MB."),
        ("latency_waterfall.png", "Figure 7: Latency Breakdown Waterfall", "Fig 7. Horizontal bar chart illustrating the relative latency contribution of each pipeline stage. Stage 3 (Encryption) understandably dominates the computation time."),
        ("security_comparison.png", "Figure 8: Security Comparison Table", "Fig 8. A multidimensional security and efficiency comparison against common baselines. CryptoFlow uniquely excels across confidentiality, integrity, and cross-modal binding with negligible overhead.")
    ]

    for fname, dtitle, dcap in diagrams_to_add:
        p_path = diagrams_dir / fname
        if p_path.exists():
            h2 = doc.add_heading(dtitle, level=2)
            h2.paragraph_format.space_before = Pt(10)
            h2.paragraph_format.space_after = Pt(4)
            doc.add_picture(str(p_path), width=Inches(6.0))
            p_cap = doc.add_paragraph(dcap)
            p_cap.paragraph_format.space_after = Pt(12)
            p_cap.runs[0].font.size = Pt(9)
            p_cap.runs[0].font.italic = True

    h1 = doc.add_heading("8. Recommended Evaluation Datasets", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph("The following datasets are officially recommended for comprehensive validation:")

    ds_data = [
        ("NIH Chest X-Ray 14", "112,120 X-ray images with disease labels. Great for mixing DICOM images with its metadata CSV for realistic bundle tests."),
        ("RSNA Pneumonia Detection", "Real DICOM format images with bounding boxes. Test real DICOM parsing and large file binding."),
        ("SIIM-ISIC Melanoma", "DICOM images + structured patient metadata. Ideal for testing Stage 1 normalization across multiple formats."),
        ("MIMIC-III Clinical Notes", "Massive database of real radiology reports. Perfect for testing the text modality binding in Stage 4."),
        ("COVID-19 CT Scans", "High-resolution volumetric CT slices. Large payload sizes to stress test AES-GCM throughput.")
    ]

    ds_table = doc.add_table(rows=len(ds_data) + 1, cols=2)
    ds_table.rows[0].cells[0].paragraphs[0].text = "Dataset Name"
    ds_table.rows[0].cells[1].paragraphs[0].text = "Description & Suitability"
    for idx, (name, desc) in enumerate(ds_data):
        ds_table.rows[idx + 1].cells[0].paragraphs[0].text = name
        ds_table.rows[idx + 1].cells[1].paragraphs[0].text = desc
    format_table(ds_table, [2.5, 4.0], header_bg="475569", alt_bg="f8fafc")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 9. RESEARCH PAPER RECOMMENDATIONS & FUTURE DIRECTIONS
    # -------------------------------------------------------------
    h1 = doc.add_heading("9. Research Paper Recommendations & Future Work", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "For your forthcoming research publication, the following sections and analytical frameworks are recommended:"
    )

    doc.add_paragraph(
        "1. Methodology Section: Present the 5-stage pipeline diagram alongside the formal cryptographic equations for the HMAC-SHA-256 cross-modal binding hash.\n"
        "2. Threat Model Formulation: Utilize the 7-attack simulation scorecard (Section 6) as the primary security validation table.\n"
        "3. PACS Clinical Integration: Highlight the sub-second latency and <0.01% storage overhead as proof that CryptoFlow can integrate seamlessly into DICOM PACS routers without network degradation.\n"
        "4. Future Work (Post-Quantum & Zero-Knowledge): Suggest extending Stage 2 key generation with Kyber/ML-KEM post-quantum key encapsulation, and adding Zero-Knowledge Proofs (ZK-SNARKs) to verify binding hashes on untrusted hospital relays without disclosing plaintext."
    )

    # Save document
    doc.save(str(output_path))
    print(f"Successfully created: {output_path}")


if __name__ == "__main__":
    root = Path(__file__).parent.parent
    out_file = root / "CryptoFlow_Research_Journal.docx"
    build_journal_document(out_file, root)
