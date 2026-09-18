/**
 * SERVICE & MAINTENANCE REQUEST FORM
 * Client-side script: real-time data sync, A4 live print preview zoom engine,
 * localStorage draft caching, JSON export/import.
 * 
 * Print view policy: ONLY show filled/typed values. Empty fields appear blank.
 * Checkbox groups display as clean comma-joined text of selected options only.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT REFERENCES ---
    const form = document.getElementById('service-request-form');
    const toastContainer = document.getElementById('toast-container');
    const previewStage = document.getElementById('preview-zoom-stage');
    const previewViewport = document.getElementById('preview-viewport');
    const zoomLevelText = document.getElementById('zoom-level-text');

    // Action Buttons
    const btnSaveDraft = document.getElementById('btn-save-draft');
    const btnSaveDraftBottom = document.getElementById('btn-save-draft-bottom');
    const btnClearForm = document.getElementById('btn-clear-form');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnImportJson = document.getElementById('btn-import-json');
    const inputImportJson = document.getElementById('input-import-json');
    const btnPrintTop = document.getElementById('btn-print-top');
    const btnPrintBottom = document.getElementById('btn-print-bottom');
    const btnPrintPreview = document.getElementById('btn-print-preview');

    // Zoom Buttons
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    let currentZoom = 0.85;
    const DRAFT_STORAGE_KEY = 'solar_service_form_draft_v1';

    // =========================================================================
    // TEXT FIELD BINDINGS: input-id → print-view element id
    // =========================================================================
    const textBindings = [
        { inputId: 'input-ticket-no',              targetId: 'pv-ticket-no',              isDateTime: false, isDate: false },
        { inputId: 'input-report-datetime',        targetId: 'pv-report-datetime',        isDateTime: true },
        { inputId: 'input-assigned-to',            targetId: 'pv-assigned-to' },
        { inputId: 'input-crn',                    targetId: 'pv-crn' },
        { inputId: 'input-customer-name',          targetId: 'pv-customer-name' },
        { inputId: 'input-utility-acct',           targetId: 'pv-utility-acct' },
        { inputId: 'input-contact-person',         targetId: 'pv-contact-person' },
        { inputId: 'input-site-address',           targetId: 'pv-site-address' },
        { inputId: 'input-gps-lat',                targetId: 'pv-gps-lat' },
        { inputId: 'input-gps-long',               targetId: 'pv-gps-long' },
        { inputId: 'input-capacity-dc',            targetId: 'pv-capacity-dc' },
        { inputId: 'input-capacity-ac',            targetId: 'pv-capacity-ac' },
        { inputId: 'input-commissioning-date',     targetId: 'pv-commissioning-date',     isDate: true },
        { inputId: 'input-module-brand',           targetId: 'pv-module-brand' },
        { inputId: 'input-module-serials',         targetId: 'pv-module-serials' },
        { inputId: 'input-inverter-brand',         targetId: 'pv-inverter-brand' },
        { inputId: 'input-inverter-serial',        targetId: 'pv-inverter-serial' },
        { inputId: 'input-battery-brand',          targetId: 'pv-battery-brand' },
        { inputId: 'input-battery-serial',         targetId: 'pv-battery-serial' },
        { inputId: 'input-logger-serial',          targetId: 'pv-logger-serial' },
        { inputId: 'input-remaining-warranty',     targetId: 'pv-remaining-warranty' },
        { inputId: 'input-fault-datetime',         targetId: 'pv-fault-datetime',         isDateTime: true },
        { inputId: 'input-error-code',             targetId: 'pv-error-code' },
        { inputId: 'input-fault-symptom',          targetId: 'pv-fault-symptom' },
        { inputId: 'input-weather-other',          targetId: 'pv-wth-other-text' },
        { inputId: 'input-outage-days',            targetId: 'pv-outage-days' },
        { inputId: 'input-outage-hours',           targetId: 'pv-outage-hours' },
        { inputId: 'input-generation-loss',        targetId: 'pv-generation-loss' },
        { inputId: 'input-affected-other',         targetId: 'pv-comp-other-text' },
        { inputId: 'input-target-resolution-date', targetId: 'pv-target-resolution-date', isDate: true },
        // Page 2
        { inputId: 'input-work-performed',         targetId: 'pv-work-performed' },
        { inputId: 'input-parts-used',             targetId: 'pv-parts-used' },
        { inputId: 'input-warranty-partno',        targetId: 'pv-warranty-partno' },
        { inputId: 'input-return-visit-date',      targetId: 'pv-return-visit-date',      isDate: true },
        { inputId: 'input-restored-datetime',      targetId: 'pv-restored-datetime',      isDateTime: true },
        { inputId: 'input-remarks-tech',           targetId: 'pv-remarks-tech' },
        { inputId: 'input-remarks-eng',            targetId: 'pv-remarks-eng' },
        { inputId: 'input-remarks-cust',           targetId: 'pv-remarks-cust' },
        { inputId: 'input-ack-tech-name',          targetId: 'pv-ack-tech-name' },
        { inputId: 'input-ack-tech-date',          targetId: 'pv-ack-tech-date',          isDate: true },
        { inputId: 'input-ack-eng-name',           targetId: 'pv-ack-eng-name' },
        { inputId: 'input-ack-eng-date',           targetId: 'pv-ack-eng-date',           isDate: true },
        { inputId: 'input-ack-cust-name',          targetId: 'pv-ack-cust-name' },
        { inputId: 'input-ack-cust-date',          targetId: 'pv-ack-cust-date',          isDate: true },
    ];

    // =========================================================================
    // CHECKBOX GROUP BINDINGS: Group → single aggregated print view cell
    // Shows only the selected options as clean comma-joined text.
    // =========================================================================
    const checkboxGroupBindings = [
        {
            targetId: 'pv-report-source',
            items: [
                { inputId: 'src-customer-complaint', label: 'Customer Complaint' },
                { inputId: 'src-monitoring-portal',  label: 'Monitoring Portal' },
                { inputId: 'src-annual-maintenance',  label: 'Annual Maintenance' },
            ]
        },
        {
            targetId: 'pv-priority',
            items: [
                { inputId: 'pri-emergency', label: 'Emergency' },
                { inputId: 'pri-high',      label: 'High' },
                { inputId: 'pri-normal',    label: 'Normal' },
                { inputId: 'pri-low',       label: 'Low' },
            ]
        },
        {
            targetId: 'pv-report-type',
            items: [
                { inputId: 'rep-corrective',  label: 'Corrective' },
                { inputId: 'rep-preventive',  label: 'Preventive' },
                { inputId: 'rep-inspection',  label: 'Inspection' },
                { inputId: 'rep-warranty',    label: 'Warranty' },
            ]
        },
        {
            targetId: 'pv-ticket-status',
            items: [
                { inputId: 'st-open',          label: 'Open' },
                { inputId: 'st-assigned',      label: 'Assigned' },
                { inputId: 'st-site-visit',    label: 'Site Visit' },
                { inputId: 'st-in-progress',   label: 'In Progress' },
                { inputId: 'st-cust-feedback', label: 'Customer Feedback' },
                { inputId: 'st-awaiting-parts',label: 'Awaiting Parts' },
                { inputId: 'st-awaiting-oem',  label: 'Awaiting OEM' },
                { inputId: 'st-resolved',      label: 'Resolved' },
                { inputId: 'st-closed',        label: 'Closed' },
            ]
        },
        {
            targetId: 'pv-grid-scheme',
            items: [
                { inputId: 'grid-net-metering',   label: 'Net Metering' },
                { inputId: 'grid-net-accounting',  label: 'Net Accounting' },
                { inputId: 'grid-net-plus',        label: 'Net Plus' },
                { inputId: 'grid-net-plus-plus',   label: 'Net Plus Plus' },
                { inputId: 'grid-off-grid',        label: 'Off Grid' },
            ]
        },
        {
            targetId: 'pv-inverter-type',
            items: [
                { inputId: 'inv-ongrid',  label: 'On Grid' },
                { inputId: 'inv-hybrid',  label: 'Hybrid' },
                { inputId: 'inv-offgrid', label: 'Off Grid' },
            ]
        },
        {
            targetId: 'pv-comm-status',
            items: [
                { inputId: 'comm-online',       label: 'Online' },
                { inputId: 'comm-offline',      label: 'Offline' },
                { inputId: 'comm-intermittent', label: 'Intermittent' },
            ]
        },
        {
            targetId: 'pv-warranty-status',
            items: [
                { inputId: 'war-under',   label: 'Under Warranty' },
                { inputId: 'war-expired', label: 'Expired' },
            ]
        },
        {
            targetId: 'pv-weather',
            items: [
                { inputId: 'wth-sunny',  label: 'Sunny' },
                { inputId: 'wth-cloudy', label: 'Cloudy' },
                { inputId: 'wth-rainy',  label: 'Rainy' },
                { inputId: 'wth-windy',  label: 'Windy' },
            ]
        },
        {
            targetId: 'pv-affected-components',
            items: [
                { inputId: 'comp-pv',         label: 'PV Array' },
                { inputId: 'comp-inverter',   label: 'Inverter' },
                { inputId: 'comp-battery',    label: 'Battery' },
                { inputId: 'comp-meter',      label: 'Meter' },
                { inputId: 'comp-wiring',     label: 'Wiring' },
                { inputId: 'comp-connectors', label: 'Connectors' },
                { inputId: 'comp-mounting',   label: 'Mounting' },
            ]
        },
        {
            targetId: 'pv-fix-type',
            items: [
                { inputId: 'fix-temporary', label: 'Temporary' },
                { inputId: 'fix-permanent', label: 'Permanent' },
            ]
        },
        {
            targetId: 'pv-monitoring',
            items: [
                { inputId: 'mon-unchanged',    label: 'Unchanged' },
                { inputId: 'mon-restored',     label: 'Restored' },
                { inputId: 'mon-nonetwork',    label: 'No Network' },
                { inputId: 'mon-unavailable',  label: 'Unavailable' },
            ]
        },
        {
            targetId: 'pv-warranty-claim',
            items: [
                { inputId: 'wc-yes', label: 'Yes' },
                { inputId: 'wc-no',  label: 'No' },
            ]
        },
        {
            targetId: 'pv-return-visit',
            items: [
                { inputId: 'rv-yes', label: 'Yes' },
                { inputId: 'rv-no',  label: 'No' },
            ]
        },
        // Photo Evidence: show only checked items as comma-joined text
        {
            targetId: 'pv-photo-evidence',
            items: [
                { inputId: 'chk-photo-fault-pre',    label: 'Fault Code / Alarm Screen' },
                { inputId: 'chk-photo-nameplate',    label: 'Inverter Nameplate' },
                { inputId: 'chk-photo-environment',  label: 'Installation Environment' },
                { inputId: 'chk-photo-switchgear',   label: 'DC/AC Switchgear' },
                { inputId: 'chk-photo-faulty-comp',  label: 'Faulty Component' },
                { inputId: 'chk-photo-post-repair',  label: 'Post-Repair' },
                { inputId: 'chk-photo-fault-post',   label: 'Post-Correction Alarm Screen' },
            ]
        },
    ];

    // =========================================================================
    // DATE FORMATTING UTILITIES
    // =========================================================================
    function formatDate(rawDateStr) {
        if (!rawDateStr) return '';
        const [year, month, day] = rawDateStr.split('-');
        if (!year || !month || !day) return rawDateStr;
        return `${day} - ${month} - ${year}`;
    }

    function formatDateTime(rawDateTimeStr) {
        if (!rawDateTimeStr) return '';
        const parts = rawDateTimeStr.split('T');
        if (parts.length !== 2) return rawDateTimeStr;
        const [year, month, day] = parts[0].split('-');
        const time = parts[1];
        return `${day} - ${month} - ${year} / ${time}`;
    }

    // =========================================================================
    // SYNC HELPERS — only show filled content; blank for empty
    // =========================================================================
    function setText(el, val) {
        if (!el) return;
        el.textContent = val || '';
        // Visual indicator: add/remove the "has-value" class for styling
        if (val && val.trim()) {
            el.classList.add('pv-has-value');
            el.classList.remove('pv-empty');
        } else {
            el.classList.remove('pv-has-value');
            el.classList.add('pv-empty');
        }
    }

    function syncTextField(binding) {
        const inputEl = document.getElementById(binding.inputId);
        const targetEl = document.getElementById(binding.targetId);
        if (!inputEl || !targetEl) return;

        const raw = inputEl.value;
        let val = '';
        if (raw && raw.trim()) {
            if (binding.isDateTime) {
                val = formatDateTime(raw);
            } else if (binding.isDate) {
                val = formatDate(raw);
            } else {
                val = raw.trim();
            }
        }
        setText(targetEl, val);
    }

    function syncCheckboxGroup(groupBinding) {
        const targetEl = document.getElementById(groupBinding.targetId);
        if (!targetEl) return;

        const selectedLabels = groupBinding.items
            .filter(item => {
                const el = document.getElementById(item.inputId);
                return el && el.checked;
            })
            .map(item => item.label);

        setText(targetEl, selectedLabels.join(', '));
    }

    // Special: weather also appends "Other: <text>" if checked
    function syncWeather() {
        const targetEl = document.getElementById('pv-weather');
        if (!targetEl) return;

        const weatherGroup = checkboxGroupBindings.find(g => g.targetId === 'pv-weather');
        const selectedLabels = weatherGroup.items
            .filter(item => {
                const el = document.getElementById(item.inputId);
                return el && el.checked;
            })
            .map(item => item.label);

        const otherCheck = document.getElementById('wth-other-check');
        const otherText = (document.getElementById('input-weather-other')?.value || '').trim();
        if (otherCheck && otherCheck.checked && otherText) {
            selectedLabels.push(otherText);
        }
        setText(targetEl, selectedLabels.join(', '));
    }

    // Special: affected components also appends "Other: <text>" if checked
    function syncAffectedComponents() {
        const targetEl = document.getElementById('pv-affected-components');
        if (!targetEl) return;

        const compGroup = checkboxGroupBindings.find(g => g.targetId === 'pv-affected-components');
        const selectedLabels = compGroup.items
            .filter(item => {
                const el = document.getElementById(item.inputId);
                return el && el.checked;
            })
            .map(item => item.label);

        const otherCheck = document.getElementById('comp-other-check');
        const otherText = (document.getElementById('input-affected-other')?.value || '').trim();
        if (otherCheck && otherCheck.checked && otherText) {
            selectedLabels.push(otherText);
        }
        setText(targetEl, selectedLabels.join(', '));
    }

    // Special: outage duration combines days + hours
    function syncOutageDuration() {
        const targetEl = document.getElementById('pv-outage-duration');
        if (!targetEl) return;
        const days = (document.getElementById('input-outage-days')?.value || '').trim();
        const hours = (document.getElementById('input-outage-hours')?.value || '').trim();
        let parts = [];
        if (days) parts.push(`${days} day${days !== '1' ? 's' : ''}`);
        if (hours) parts.push(`${hours} hr${hours !== '1' ? 's' : ''}`);
        setText(targetEl, parts.join(' '));
    }

    // Special: warranty claim row also shows part number
    function syncWarrantyClaim() {
        const targetEl = document.getElementById('pv-warranty-claim');
        if (!targetEl) return;
        const wcGroup = checkboxGroupBindings.find(g => g.targetId === 'pv-warranty-claim');
        const selected = wcGroup.items
            .filter(item => { const el = document.getElementById(item.inputId); return el && el.checked; })
            .map(item => item.label);
        const partNo = (document.getElementById('input-warranty-partno')?.value || '').trim();
        let text = selected.join(', ');
        if (partNo) text += (text ? ' — Part No: ' : 'Part No: ') + partNo;
        setText(targetEl, text);
        // Also sync the standalone part-no target if it exists
        const partEl = document.getElementById('pv-warranty-partno');
        if (partEl) setText(partEl, partNo);
    }

    // Special: return visit also shows date
    function syncReturnVisit() {
        const targetEl = document.getElementById('pv-return-visit');
        if (!targetEl) return;
        const rvGroup = checkboxGroupBindings.find(g => g.targetId === 'pv-return-visit');
        const selected = rvGroup.items
            .filter(item => { const el = document.getElementById(item.inputId); return el && el.checked; })
            .map(item => item.label);
        const rawDate = document.getElementById('input-return-visit-date')?.value || '';
        let text = selected.join(', ');
        const dateFormatted = formatDate(rawDate);
        if (dateFormatted) text += (text ? ' — Date: ' : 'Date: ') + dateFormatted;
        setText(targetEl, text);
        // Also sync standalone return-visit-date target
        const rvDateEl = document.getElementById('pv-return-visit-date');
        if (rvDateEl) setText(rvDateEl, dateFormatted);
    }

    // =========================================================================
    // SYNC HEADER META (ticket, date shown in print page header)
    // =========================================================================
    function syncHeaderMeta() {
        const ticketVal = (document.getElementById('input-ticket-no')?.value || '').trim();
        const dtVal = document.getElementById('input-report-datetime')?.value || '';
        const dateFormatted = dtVal ? formatDateTime(dtVal) : '';

        const hTicket = document.getElementById('pv-header-ticket');
        const hDate = document.getElementById('pv-header-date');
        const p2Ticket = document.getElementById('pv-p2-ticket');

        if (hTicket) hTicket.textContent = ticketVal;
        if (hDate) hDate.textContent = dateFormatted;
        if (p2Ticket) p2Ticket.textContent = ticketVal;
    }

    // =========================================================================
    // SYNC ALL DATA
    // =========================================================================
    function syncAllData() {
        // Text fields
        textBindings.forEach(syncTextField);

        // Checkbox groups (standard)
        checkboxGroupBindings.forEach(grp => {
            if (['pv-weather', 'pv-affected-components', 'pv-warranty-claim', 'pv-return-visit'].includes(grp.targetId)) {
                return; // handled separately
            }
            syncCheckboxGroup(grp);
        });

        // Special sync handlers
        syncWeather();
        syncAffectedComponents();
        syncOutageDuration();
        syncWarrantyClaim();
        syncReturnVisit();
        syncHeaderMeta();
    }

    // =========================================================================
    // REAL-TIME EVENT LISTENERS
    // =========================================================================
    form.addEventListener('input', (e) => {
        const id = e.target.id;

        // Text field?
        const tBinding = textBindings.find(b => b.inputId === id);
        if (tBinding) syncTextField(tBinding);

        // Auto-check "wth-other-check" if user types in weather other field
        if (id === 'input-weather-other') {
            const wthOtherCheck = document.getElementById('wth-other-check');
            if (wthOtherCheck && e.target.value.trim() && !wthOtherCheck.checked) {
                wthOtherCheck.checked = true;
            }
            syncWeather();
        }

        // Auto-check "comp-other-check" if user types in affected other field
        if (id === 'input-affected-other') {
            const compOtherCheck = document.getElementById('comp-other-check');
            if (compOtherCheck && e.target.value.trim() && !compOtherCheck.checked) {
                compOtherCheck.checked = true;
            }
            syncAffectedComponents();
        }

        // Outage duration
        if (id === 'input-outage-days' || id === 'input-outage-hours') {
            syncOutageDuration();
        }

        // Warranty part no
        if (id === 'input-warranty-partno') {
            syncWarrantyClaim();
        }

        // Return visit date
        if (id === 'input-return-visit-date') {
            syncReturnVisit();
        }
    });

    form.addEventListener('change', (e) => {
        const id = e.target.id;
        const type = e.target.type;

        if (type === 'checkbox' || type === 'radio') {
            // Find which group this belongs to
            let handled = false;
            for (const grp of checkboxGroupBindings) {
                if (grp.items.some(item => item.inputId === id)) {
                    if (grp.targetId === 'pv-weather') { syncWeather(); }
                    else if (grp.targetId === 'pv-affected-components') { syncAffectedComponents(); }
                    else if (grp.targetId === 'pv-warranty-claim') { syncWarrantyClaim(); }
                    else if (grp.targetId === 'pv-return-visit') { syncReturnVisit(); }
                    else { syncCheckboxGroup(grp); }
                    handled = true;
                    break;
                }
            }
            // Photo evidence group (special - uses its own target)
            if (!handled) {
                const photoGroup = checkboxGroupBindings.find(g => g.targetId === 'pv-photo-evidence');
                if (photoGroup && photoGroup.items.some(item => item.inputId === id)) {
                    syncCheckboxGroup(photoGroup);
                }
            }
        } else {
            // Date/datetime inputs fire 'change'
            const tBinding = textBindings.find(b => b.inputId === id);
            if (tBinding) syncTextField(tBinding);
        }
    });

    // =========================================================================
    // ZOOM ENGINE FOR LIVE PRINT PREVIEW
    // =========================================================================
    function updateZoom(newZoom) {
        currentZoom = Math.min(Math.max(newZoom, 0.3), 1.8);
        previewStage.style.transform = `scale(${currentZoom})`;
        zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => updateZoom(currentZoom + 0.1));
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => updateZoom(currentZoom - 0.1));
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => updateZoom(1.0));

    if (btnZoomFit) {
        btnZoomFit.addEventListener('click', () => {
            if (!previewViewport) return;
            const availableWidth = previewViewport.clientWidth - 48;
            const a4WidthPx = 794;
            const fitScale = Math.min(Math.max(availableWidth / a4WidthPx, 0.3), 1.4);
            updateZoom(fitScale);
        });
    }

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg style="width: 16px; height: 16px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success'
                    ? '<polyline points="20 6 9 17 4 12"></polyline>'
                    : type === 'danger'
                    ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                    : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 260);
        }, 3200);
    }

    // =========================================================================
    // DRAFT PERSISTENCE VIA LOCALSTORAGE
    // =========================================================================
    function collectFormData() {
        const formData = {};
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (!el.id) continue;
            if (el.type === 'checkbox' || el.type === 'radio') {
                formData[el.id] = el.checked;
            } else {
                formData[el.id] = el.value;
            }
        }
        return formData;
    }

    function applyFormData(formData) {
        for (const [key, value] of Object.entries(formData)) {
            const el = document.getElementById(key) || form.elements[key];
            if (!el) continue;
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = Boolean(value);
            } else {
                el.value = value;
            }
        }
        syncAllData();
    }

    function saveDraft() {
        try {
            const formData = collectFormData();
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
            showToast('Draft saved successfully.', 'success');
        } catch (e) {
            showToast('Unable to save draft (storage full or disabled).', 'danger');
        }
    }

    function loadDraft(showNotification = true) {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!saved) return false;
        try {
            const formData = JSON.parse(saved);
            applyFormData(formData);
            if (showNotification) showToast('Draft restored.', 'info');
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearForm() {
        if (!window.confirm('Are you sure you want to clear all form data?')) return;
        form.reset();
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        syncAllData();
        showToast('Form cleared.', 'info');
    }

    // =========================================================================
    // EXPORT JSON BACKUP
    // =========================================================================
    function exportJsonBackup() {
        const formData = collectFormData();

        const rawTicket = (document.getElementById('input-ticket-no')?.value || '').trim();
        const ticketNo = rawTicket.replace(/[\/\\:*?"<>|\s]+/g, '-') || 'NO-TICKET';

        const reportDatetimeInput = document.getElementById('input-report-datetime')?.value || '';
        let datePart = '', timePart = '';

        if (reportDatetimeInput && reportDatetimeInput.includes('T')) {
            const [d, t] = reportDatetimeInput.split('T');
            datePart = d;
            timePart = t.replace(':', '-');
        } else {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
        }

        const fileName = `${ticketNo}_${datePart}_${timePart}.json`;

        const exportPayload = {
            app: 'SERVICE_AND_MAINTENANCE_REQUEST_FORM',
            version: '1.1',
            exportedAt: new Date().toISOString(),
            ticketNo: rawTicket || 'NO-TICKET',
            data: formData
        };

        const jsonString = JSON.stringify(exportPayload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported: ${fileName}`, 'success');
    }

    // =========================================================================
    // IMPORT JSON BACKUP
    // =========================================================================
    function triggerImportJson() {
        if (inputImportJson) {
            inputImportJson.value = '';
            inputImportJson.click();
        }
    }

    if (inputImportJson) {
        inputImportJson.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    const dataToLoad = parsed.data || parsed;
                    form.reset();
                    applyFormData(dataToLoad);
                    try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(dataToLoad)); } catch (_) {}
                    showToast(`Imported: ${file.name}`, 'success');
                } catch (err) {
                    showToast('Error importing JSON. Invalid file structure.', 'danger');
                }
            };
            reader.readAsText(file);
        });
    }

    // =========================================================================
    // PRINT TRIGGER
    // =========================================================================
    function triggerPrint() {
        const requiredFields = [
            { id: 'input-ticket-no',      name: 'Ticket No.' },
            { id: 'input-report-datetime', name: 'Report Date & Time' },
            { id: 'input-customer-name',  name: 'Customer Name' },
            { id: 'input-site-address',   name: 'Site Address' },
        ];

        const missing = requiredFields
            .filter(f => { const el = document.getElementById(f.id); return !el || !el.value.trim(); })
            .map(f => f.name);

        if (missing.length > 0) {
            const proceed = window.confirm(
                `The following recommended fields are empty:\n\n• ${missing.join('\n• ')}\n\nPrint anyway?`
            );
            if (!proceed) {
                const firstId = requiredFields.find(f => missing.includes(f.name))?.id;
                if (firstId) {
                    const firstEl = document.getElementById(firstId);
                    if (firstEl) { firstEl.focus(); firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                }
                return;
            }
        }

        // Auto-save draft before print
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collectFormData()));
        } catch (_) {}

        window.print();
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    if (btnSaveDraft) btnSaveDraft.addEventListener('click', saveDraft);
    if (btnSaveDraftBottom) btnSaveDraftBottom.addEventListener('click', saveDraft);
    if (btnClearForm) btnClearForm.addEventListener('click', clearForm);
    if (btnExportJson) btnExportJson.addEventListener('click', exportJsonBackup);
    if (btnImportJson) btnImportJson.addEventListener('click', triggerImportJson);
    if (btnPrintTop) btnPrintTop.addEventListener('click', triggerPrint);
    if (btnPrintBottom) btnPrintBottom.addEventListener('click', triggerPrint);
    if (btnPrintPreview) btnPrintPreview.addEventListener('click', triggerPrint);

    // =========================================================================
    // INITIAL LOAD
    // =========================================================================
    const draftLoaded = loadDraft(false);
    if (!draftLoaded) syncAllData();

    // Set responsive initial zoom
    setTimeout(() => { if (btnZoomFit) btnZoomFit.click(); }, 120);

    // Adjust zoom on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth < 1200) updateZoom(0.7);
    });
});
