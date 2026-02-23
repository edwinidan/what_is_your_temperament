// ==========================================
// REPORT.JS - Print to PDF Rendering Logic
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const reportContainer = document.getElementById("report-content");
    const errorContainer = document.getElementById("error-message");
    const printBtn = document.getElementById("print-btn");

    printBtn.addEventListener("click", () => {
        window.print();
        if (window.plausible) {
            plausible("report_print_clicked");
        }
    });

    // 1. Extract payload from URL hash
    const hash = window.location.hash;
    if (!hash.startsWith("#result=")) {
        showError();
        return;
    }

    const token = hash.replace("#result=", "");
    const payload = decodeSharePayload(token);

    if (!payload || !validatePayload(payload)) {
        showError();
        return;
    }

    // 2. Safely extract primary temperament and normalize mapped key
    const primaryName = payload.p;
    const primaryKey = primaryName.toLowerCase();
    const content = TEMPERAMENT_CONTENT[primaryKey];

    if (!content) {
        showError();
        return;
    }

    // 3. Render Report
    renderReport(payload, content, reportContainer);

    if (window.plausible) {
        plausible("report_opened", { props: { primary_temperament: primaryName } });
    }
});

function showError() {
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) errorMsg.classList.remove("hidden");
}

function validatePayload(data) {
    if (data.v !== 1) return false;
    if (!data.p || !data.s || !data.c || !data.mix) return false;

    const mixSum = Object.values(data.mix).reduce((sum, val) => sum + val, 0);
    if (mixSum < 99 || mixSum > 101) return false; // Account for floating/rounding noise

    return true;
}

function renderReport(payload, content, container) {
    // Clear any existing (non-error) content 
    // (We actually just want to append to avoid removing error state node entirely if we needed it, but innerHTML is cleaner here)
    const safePrimary = escapeHTML(content.name);
    const colorVar = `var(--color-${safePrimary.toLowerCase()})`;

    const strengthsHTML = content.strengths.map(s => `<li>${escapeHTML(s)}</li>`).join("");
    const weaknessesHTML = content.weaknesses.map(w => `<li>${escapeHTML(w)}</li>`).join("");

    // Sort mix natively dominance-first
    const mixEntries = Object.entries(payload.mix)
        .sort((a, b) => b[1] - a[1]);

    const mixTableHTML = mixEntries.map(([temp, pct]) => {
        const tempCap = temp.charAt(0).toUpperCase() + temp.slice(1);
        const tempColor = `var(--color-${temp})`;
        return `
      <tr>
        <td class="mix-name">${escapeHTML(tempCap)}</td>
        <td class="mix-bar-cell">
          <div class="mix-bar-track">
            <div class="mix-bar-fill" style="width: ${pct}%; background-color: ${tempColor};"></div>
          </div>
        </td>
        <td class="mix-pct">${pct}%</td>
      </tr>
    `;
    }).join("");

    // Extract confidence blurb
    const confKey = payload.c.toLowerCase();
    const confText = content.confidenceCopy[confKey] || content.confidenceCopy.medium;

    const html = `
    <header>
      <p class="report-eyebrow">Temperament Insight Report</p>
      <h1 class="primary-title" style="color: ${colorVar}">${safePrimary}</h1>
      <p class="tagline">${escapeHTML(content.tagline)}</p>
      <div class="short-summary">${escapeHTML(content.shortSummary)}</div>
    </header>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Secondary Influence</h4>
        <p>${escapeHTML(payload.s)}</p>
        <small>Provides texture and secondary operational style.</small>
      </div>
      <div class="meta-box">
        <h4>Confidence Level</h4>
        <p style="text-transform: capitalize;">${escapeHTML(payload.c)}</p>
        <small>${escapeHTML(confText)}</small>
      </div>
    </div>

    <section>
      <h3 class="section-title">Temperament Mix Blueprint</h3>
      <table class="mix-table">
        <tbody>
          ${mixTableHTML}
        </tbody>
      </table>
    </section>

    <div class="content-grid">
      <section class="list-card">
        <h3 class="section-title">Natural Strengths</h3>
        <ul>${strengthsHTML}</ul>
      </section>
      <section class="list-card">
        <h3 class="section-title">Potential Watch-outs</h3>
        <ul>${weaknessesHTML}</ul>
      </section>
    </div>

    <section class="comms-section">
      <h3 class="section-title">Communication Style</h3>
      <p>${escapeHTML(content.communication)}</p>
    </section>

    <footer>
      Educational reflection, not a clinical diagnosis. Generated via whatismytemperament.com
    </footer>
  `;

    container.innerHTML = html;
}

// ------------------------------------------
// SHARED UTILITIES (Cloned safely from app.js)
// ------------------------------------------

function decodeSharePayload(token) {
    try {
        let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const jsonString = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
}
