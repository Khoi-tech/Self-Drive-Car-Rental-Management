import os
import re
import html
import subprocess

def parse_markdown_to_html(md_text):
    lines = md_text.splitlines()
    html_out = []
    
    in_table = False
    table_rows = []
    in_code = False
    code_lang = ""
    code_lines = []
    in_list = False
    list_type = "ul"
    
    def flush_table():
        nonlocal in_table, table_rows
        if not in_table or not table_rows:
            in_table = False
            table_rows = []
            return
        
        res = ["<div class='table-container'><table>"]
        headers = table_rows[0]
        res.append("<thead><tr>")
        for h in headers:
            res.append(f"<th>{format_inline(h)}</th>")
        res.append("</tr></thead><tbody>")
        
        for r in table_rows[1:]:
            res.append("<tr>")
            for c in r:
                res.append(f"<td>{format_inline(c)}</td>")
            res.append("</tr>")
        res.append("</tbody></table></div>")
        html_out.append("\n".join(res))
        in_table = False
        table_rows = []

    def flush_list():
        nonlocal in_list, list_type
        if in_list:
            html_out.append(f"</{list_type}>")
            in_list = False

    def format_inline(text):
        t = text.strip()
        t = t.replace(r"$\ge$", "≥").replace(r"\ge", "≥").replace("$\\ge 3$", "≥ 3").replace("$\\ge 7$", "≥ 7")
        t = t.replace(r"$\rightarrow$", " → ").replace(r"\rightarrow", " → ").replace("$\\to$", " → ")
        
        t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
        t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', t)
        t = re.sub(r'`([^`]+?)`', r'<code>\1</code>', t)
        t = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', t)
        
        return t

    i = 0
    # Skip main title and metadata since we render a dedicated academic cover page
    skip_header = True
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # When we hit the first section "## 1. TỔNG QUAN DỰ ÁN", stop skipping
        if stripped.startswith("## 1."):
            skip_header = False
            
        if skip_header:
            i += 1
            continue

        # Code block boundary
        if stripped.startswith("```"):
            if in_code:
                if code_lang == "mermaid":
                    m_content = "\n".join(code_lines)
                    html_out.append(f"<div class='mermaid-box'><pre class='mermaid'>\n{m_content}\n</pre></div>")
                else:
                    c_content = html.escape("\n".join(code_lines))
                    html_out.append(f"<pre class='code-block'><code>{c_content}</code></pre>")
                in_code = False
                code_lang = ""
                code_lines = []
            else:
                flush_table()
                flush_list()
                in_code = True
                code_lang = stripped[3:].strip()
                code_lines = []
            i += 1
            continue
            
        if in_code:
            code_lines.append(line)
            i += 1
            continue
            
        # Math display block: $$...$$
        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            flush_table()
            flush_list()
            math_text = stripped[2:-2].strip()
            math_text = math_text.replace(r"\text{", "").replace("}", "")
            math_text = math_text.replace(r"\ge", "≥").replace(r"\rightarrow", " → ")
            html_out.append(f"<div class='math-display'>{math_text}</div>")
            i += 1
            continue

        # Horizontal rule
        if stripped in ["---", "***", "___"]:
            flush_table()
            flush_list()
            # We don't need raw hr, section titles handle separation
            i += 1
            continue

        # Headings
        if stripped.startswith("#"):
            flush_table()
            flush_list()
            m = re.match(r'^(#{1,6})\s+(.*)$', stripped)
            if m:
                level = len(m.group(1))
                h_text = format_inline(m.group(2))
                if level == 2:
                    # Major section title -> Page break before
                    html_out.append(f"<div class='page-break'></div>")
                    html_out.append(f"<h2 class='section-title'>{h_text}</h2>")
                elif level == 3:
                    html_out.append(f"<h3 class='subsection-title'>{h_text}</h3>")
                else:
                    html_out.append(f"<h{level}>{h_text}</h{level}>")
                i += 1
                continue

        # Table row
        if stripped.startswith("|") and stripped.endswith("|"):
            flush_list()
            if re.match(r'^\|[\s\-:|]+\|$', stripped):
                i += 1
                continue
            cells = [c.strip() for c in stripped[1:-1].split("|")]
            if not in_table:
                in_table = True
                table_rows = [cells]
            else:
                table_rows.append(cells)
            i += 1
            continue
        else:
            if in_table:
                flush_table()

        # Lists: - item or 1. item
        list_match = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', line)
        if list_match:
            flush_table()
            indent, marker, content = list_match.groups()
            curr_type = "ol" if marker.endswith(".") else "ul"
            
            if not in_list or list_type != curr_type:
                flush_list()
                in_list = True
                list_type = curr_type
                html_out.append(f"<{list_type}>")
            
            html_out.append(f"<li>{format_inline(content)}</li>")
            i += 1
            continue
        else:
            if in_list:
                flush_list()

        # Blank line
        if not stripped:
            i += 1
            continue

        # Normal paragraph
        p_text = format_inline(stripped)
        html_out.append(f"<p>{p_text}</p>")
        i += 1

    flush_table()
    flush_list()
    return "\n".join(html_out)


def build_full_html(body_html):
    cover_page_html = """
<div class="cover-page">
    <div class="cover-border">
        <div class="uni-header">
            <div class="uni-name">TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - TIN HỌC TP. HỒ CHÍ MINH</div>
            <div class="uni-sub">KHOA CÔNG NGHỆ THÔNG TIN</div>
            <div class="uni-line">━━━━━━━━━━━━━━━━━━━━━━</div>
        </div>
        
        <div class="cover-main">
            <div class="report-type">BÁO CÁO TOÀN DIỆN ĐỒ ÁN MÔN HỌC</div>
            <div class="course-title">MÔN HỌC: CÔNG NGHỆ PHẦN MỀM NÂNG CAO (CNPM_NC)</div>
            
            <div class="topic-box">
                <div class="topic-label">ĐỀ TÀI:</div>
                <div class="topic-title">HỆ THỐNG QUẢN LÝ THUÊ XE TỰ LÁI CAO CẤP<br>(DỰ ÁN VELORA)</div>
                <div class="topic-sub">NỀN TẢNG QUẢN TRỊ VẬN HÀNH THUÊ XE TOÀN DIỆN (5 SPRINTS — 23 USER STORIES)</div>
            </div>
        </div>
        
        <div class="cover-meta">
            <table class="meta-table">
                <tr>
                    <td class="meta-label">Sinh viên thực hiện:</td>
                    <td class="meta-val"><strong>HUỲNH MINH KHÔI</strong></td>
                </tr>
                <tr>
                    <td class="meta-label">Ngành học:</td>
                    <td class="meta-val">Kỹ thuật Phần mềm / Công nghệ Thông tin</td>
                </tr>
                <tr>
                    <td class="meta-label">Kho lưu trữ mã nguồn:</td>
                    <td class="meta-val"><code>https://github.com/Khoi-tech/Self-Drive-Car-Rental-Management.git</code></td>
                </tr>
                <tr>
                    <td class="meta-label">Nhánh & Commit:</td>
                    <td class="meta-val">Nhánh <code>main</code> — Commit <code>9afba8b</code></td>
                </tr>
                <tr>
                    <td class="meta-label">Thời điểm hoàn thành:</td>
                    <td class="meta-val">Tháng 10 / Năm 2026</td>
                </tr>
            </table>
        </div>
        
        <div class="cover-footer">
            TP. HỒ CHÍ MINH, THÁNG 10/2026
        </div>
    </div>
</div>

<div class="page-break"></div>

<div class="toc-page">
    <h2 class="toc-title">MỤC LỤC TỔNG QUAN BÁO CÁO</h2>
    <div class="toc-list">
        <div class="toc-item"><span><strong>1. TỔNG QUAN DỰ ÁN</strong></span><span class="toc-dots"></span><span>Trang 3</span></div>
        <div class="toc-subitem"><span>1.1. Giới thiệu dự án VELORA</span><span class="toc-dots"></span><span>Trang 3</span></div>
        <div class="toc-subitem"><span>1.2. Trạng thái vận hành hiện tại</span><span class="toc-dots"></span><span>Trang 3</span></div>
        
        <div class="toc-item"><span><strong>2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ (TECH STACK)</strong></span><span class="toc-dots"></span><span>Trang 4</span></div>
        <div class="toc-subitem"><span>2.1. Sơ đồ kiến trúc N-Tier</span><span class="toc-dots"></span><span>Trang 4</span></div>
        <div class="toc-subitem"><span>2.2. Bảng công nghệ chi tiết (.NET 10, React 18, PostgreSQL)</span><span class="toc-dots"></span><span>Trang 5</span></div>
        
        <div class="toc-item"><span><strong>3. CHI TIẾT KẾT QUẢ TRIỂN KHAI 5 SPRINTS (62 STORY POINTS)</strong></span><span class="toc-dots"></span><span>Trang 6</span></div>
        <div class="toc-subitem"><span>3.1. Sprint 1: Danh Mục Xe & Bảng Giá Động (12 SP)</span><span class="toc-dots"></span><span>Trang 6</span></div>
        <div class="toc-subitem"><span>3.2. Sprint 2: Đặt Xe, Thẩm Định Hồ Sơ & Mẫu Điều Khoản (11 SP)</span><span class="toc-dots"></span><span>Trang 7</span></div>
        <div class="toc-subitem"><span>3.3. Sprint 3: Ký HĐ Điện Tử, Cọc Xe & Bàn Giao (11 SP)</span><span class="toc-dots"></span><span>Trang 7</span></div>
        <div class="toc-subitem"><span>3.4. Sprint 4: Vận Hành Chuyến Đi — Gia Hạn, Sự Cố & Bảo Dưỡng (11 SP)</span><span class="toc-dots"></span><span>Trang 8</span></div>
        <div class="toc-subitem"><span>3.5. Sprint 5: Hoàn Trả Xe, Quyết Toán Cọc & Báo Cáo Doanh Thu (17 SP)</span><span class="toc-dots"></span><span>Trang 8</span></div>
        
        <div class="toc-item"><span><strong>4. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)</strong></span><span class="toc-dots"></span><span>Trang 10</span></div>
        <div class="toc-subitem"><span>4.1. Sơ đồ quan hệ thực thể (ER Diagram)</span><span class="toc-dots"></span><span>Trang 10</span></div>
        <div class="toc-subitem"><span>4.2. Danh sách 17 bảng dữ liệu chính thức</span><span class="toc-dots"></span><span>Trang 11</span></div>
        
        <div class="toc-item"><span><strong>5. DỮ LIỆU MẪU & KIỂM THỬ HỆ THỐNG</strong></span><span class="toc-dots"></span><span>Trang 12</span></div>
        <div class="toc-subitem"><span>5.1. Bộ dữ liệu mẫu (27 xe sang, 28 bảo hiểm, tài khoản test)</span><span class="toc-dots"></span><span>Trang 12</span></div>
        <div class="toc-subitem"><span>5.2. Kết quả kiểm thử tích hợp E2E (100% Passed)</span><span class="toc-dots"></span><span>Trang 12</span></div>
        
        <div class="toc-item"><span><strong>6. KẾT LUẬN & ĐÁNH GIÁ CHUNG</strong></span><span class="toc-dots"></span><span>Trang 13</span></div>
        <div class="toc-subitem"><span>6.1. Đánh giá chất lượng kỹ thuật</span><span class="toc-dots"></span><span>Trang 13</span></div>
    </div>
</div>
"""

    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Báo Cáo Toàn Diện Đồ Án VELORA - HUFLIT</title>
<style>
@page {{
    size: A4 portrait;
    margin: 20mm 20mm 20mm 25mm;
}}

* {{
    box-sizing: border-box;
}}

body {{
    font-family: 'Times New Roman', Times, 'Liberation Serif', serif;
    font-size: 14pt;
    line-height: 1.5;
    color: #111111;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
    text-align: justify;
    text-justify: inter-word;
}}

/* Cover Page Styling */
.cover-page {{
    height: 100%;
    min-height: 960px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
}}

.cover-border {{
    border: 3px double #0f2b5c;
    padding: 30px 25px;
    height: 960px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
}}

.uni-header {{
    margin-top: 10px;
}}

.uni-name {{
    font-size: 15pt;
    font-weight: bold;
    color: #0b1a30;
    text-transform: uppercase;
}}

.uni-sub {{
    font-size: 14pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-top: 5px;
}}

.uni-line {{
    color: #0f2b5c;
    letter-spacing: 2px;
    margin-top: 8px;
    font-size: 11pt;
}}

.cover-main {{
    margin: 40px 0;
}}

.report-type {{
    font-size: 16pt;
    font-weight: bold;
    color: #b45309;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
}}

.course-title {{
    font-size: 14pt;
    font-weight: bold;
    color: #334155;
    margin-bottom: 30px;
}}

.topic-box {{
    border-top: 2px solid #0f2b5c;
    border-bottom: 2px solid #0f2b5c;
    padding: 24px 15px;
    background-color: #f8fafc;
}}

.topic-label {{
    font-size: 14pt;
    font-weight: bold;
    color: #475569;
    margin-bottom: 6px;
}}

.topic-title {{
    font-size: 20pt;
    font-weight: bold;
    color: #0f172a;
    line-height: 1.3;
    text-transform: uppercase;
    margin-bottom: 8px;
}}

.topic-sub {{
    font-size: 12pt;
    color: #475569;
    font-weight: bold;
    letter-spacing: 0.5px;
}}

.cover-meta {{
    width: 90%;
    margin: 20px auto;
    text-align: left;
}}

.meta-table {{
    width: 100%;
    border-collapse: collapse;
}}

.meta-table td {{
    border: none;
    padding: 7px 10px;
    font-size: 13.5pt;
    background: transparent !important;
}}

.meta-label {{
    width: 40%;
    color: #334155;
}}

.meta-val {{
    width: 60%;
    color: #0f172a;
}}

.cover-footer {{
    font-size: 13pt;
    font-weight: bold;
    color: #0f2b5c;
    margin-bottom: 10px;
}}

/* Table of Contents */
.toc-page {{
    padding-top: 10px;
}}

.toc-title {{
    font-size: 17pt;
    font-weight: bold;
    text-align: center;
    color: #0f2b5c;
    margin-bottom: 30px;
    text-transform: uppercase;
    border-bottom: 2px solid #0f2b5c;
    padding-bottom: 8px;
}}

.toc-list {{
    font-size: 14pt;
    line-height: 2.0;
}}

.toc-item {{
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
}}

.toc-subitem {{
    display: flex;
    justify-content: space-between;
    padding-left: 25px;
    font-size: 13.5pt;
    color: #334155;
}}

.toc-dots {{
    flex: 1;
    border-bottom: 1px dotted #94a3b8;
    margin: 0 8px 6px 8px;
}}

/* Headings in Content */
h2.section-title {{
    font-size: 16pt;
    font-weight: bold;
    color: #0f2b5c;
    border-bottom: 2px solid #0f2b5c;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 14px;
    page-break-after: avoid;
    break-after: avoid;
}}

h3.subsection-title {{
    font-size: 14pt;
    font-weight: bold;
    color: #1a365d;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
}}

p {{
    font-size: 14pt;
    line-height: 1.5;
    margin-top: 0;
    margin-bottom: 10px;
    text-indent: 1.25cm;
}}

p strong, li strong {{
    font-weight: bold;
}}

/* Lists */
ul, ol {{
    margin-top: 6px;
    margin-bottom: 12px;
    padding-left: 36px;
}}

li {{
    font-size: 14pt;
    line-height: 1.45;
    margin-bottom: 5px;
    text-align: justify;
}}

/* Tables */
.table-container {{
    margin: 14px 0 18px 0;
    page-break-inside: avoid;
    break-inside: avoid;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 13pt;
    line-height: 1.35;
    margin: 0 auto;
}}

th, td {{
    border: 1px solid #334155;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
}}

th {{
    background-color: #e2e8f0;
    font-weight: bold;
    color: #0f172a;
    text-align: center;
}}

tr:nth-child(even) td {{
    background-color: #f8fafc;
}}

/* Code & Formulas */
code {{
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12pt;
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 3px;
    color: #0f172a;
}}

pre.code-block {{
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    padding: 10px 12px;
    font-size: 11pt;
    line-height: 1.3;
    font-family: 'Consolas', 'Courier New', monospace;
    overflow-x: auto;
    page-break-inside: avoid;
    margin: 12px 0;
}}

.math-display {{
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #16a34a;
    padding: 10px 14px;
    margin: 12px 0;
    text-align: center;
    font-size: 13pt;
    font-weight: bold;
    font-style: italic;
    color: #14532d;
    page-break-inside: avoid;
}}

/* Diagrams */
.mermaid-box {{
    margin: 16px 0;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
    max-width: 100%;
    overflow: hidden;
}}

.mermaid {{
    display: flex;
    justify-content: center;
}}

.mermaid svg {{
    max-width: 100% !important;
    height: auto !important;
}}

a {{
    color: #0284c7;
    text-decoration: underline;
}}

.page-break {{
    page-break-before: always;
    break-before: page;
}}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {{
    mermaid.initialize({{
        startOnLoad: true,
        theme: 'neutral',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 14
    }});
}});
</script>
</head>
<body>

{cover_page_html}

{body_html}

</body>
</html>"""


def main():
    md_path = r"C:\Users\Khoi\.gemini\antigravity\brain\974d4a31-a7cf-44db-84d5-6093ca19a0cb\bao_cao_chi_tiet_do_an_velora.md"
    html_path = r"D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management\scripts\report_preview.html"
    pdf_path = r"D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management\Bao_Cao_Do_An_VELORA.pdf"
    
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    os.makedirs(os.path.dirname(html_path), exist_ok=True)
    body_html = parse_markdown_to_html(md_text)
    full_html = build_full_html(body_html)
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
        
    print(f"Generated HTML at: {html_path} ({os.path.getsize(html_path)} bytes)")
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        print(f"Error: Edge not found at {edge_path}")
        return
        
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=8000",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    
    print("Running headless Edge command to export PDF...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(pdf_path):
        pdf_size = os.path.getsize(pdf_path)
        print(f"SUCCESS: PDF created successfully at {pdf_path}")
        print(f"File Size: {pdf_size} bytes ({pdf_size / 1024:.2f} KB)")
    else:
        print(f"ERROR: PDF was not generated. Edge stderr:\n{res.stderr}")

if __name__ == "__main__":
    main()
