// MRI Prostata Befund Generator - Portable Version with Error Handling
// Global variables for cross-platform compatibility
let befundGenerator = null;
let imageCombiner = null;
let piradssPainter = null;

// Utility functions for cross-platform compatibility
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

function safeAddEventListener(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, handler);
    } else {
        console.warn('Cannot add event listener to element:', element);
    }
}

// MRI Prostata Befund Generator - Korrigierte Version
class BefundGenerator {
    constructor() {
        // DOM Elements with error handling
        this.generateBtn = safeGetElement('generateBtn');
        this.befundOutput = safeGetElement('befundOutput');
        this.plainOutput = safeGetElement('plainOutput');
        this.statusMessage = safeGetElement('statusMessage');
        this.copyHtmlBtn = safeGetElement('copyHtmlBtn');
        this.copyPlainBtn = safeGetElement('copyPlainBtn');
        
        // Messungsfelder
        this.measureA = safeGetElement('measureA');
        this.measureB = safeGetElement('measureB');
        this.measureC = safeGetElement('measureC');
        this.psaValue = safeGetElement('psaValue');
        this.calculatedVolume = safeGetElement('calculatedVolume');
        this.calculatedPsaDensity = safeGetElement('calculatedPsaDensity');
        
        // Parameter
        this.piQual = safeGetElement('piQual');
        this.epeGrade = safeGetElement('epeGrade');
        
        // Klinisches Setting
        this.klinischesSetting = safeGetElement('klinischesSetting');
        
        // Voruntersuchungen
        this.voruntersuchungen = safeGetElement('voruntersuchungen');
        
        // Läsionen
        this.addLesionBtn = safeGetElement('addLesionBtn');
        this.lesionsContainer = safeGetElement('lesionsContainer');
        this.lesions = [];
        
        // Befundabschnitte
        this.neuroBundle = safeGetElement('neuroBundle');
        this.seminalVesicles = safeGetElement('seminalVesicles');
        this.peritoneum = safeGetElement('peritoneum');
        this.lymphNodes = safeGetElement('lymphNodes');
        this.skeleton = safeGetElement('skeleton');
        this.incidentalFindings = safeGetElement('incidentalFindings');
        this.assessment = safeGetElement('assessment');
        
        // Berechnungswerte
        this.currentVolume = 0;
        this.currentPsaDensity = 0;
        
        this.init();
    }

    init() {
        // Event Listeners
        this.generateBtn.addEventListener('click', () => this.generateBefund());
        this.copyHtmlBtn.addEventListener('click', () => this.copyHtmlToClipboard());
        this.copyPlainBtn.addEventListener('click', () => this.copyPlainToClipboard());
        this.addLesionBtn.addEventListener('click', () => this.addLesion());
        
        // Klinisches Setting Event Listener
        this.klinischesSetting.addEventListener('change', () => this.handleKlinischesSettingChange());
        
        // Messungsfelder Event Listeners
        [this.measureA, this.measureB, this.measureC].forEach(input => {
            input.addEventListener('input', () => this.handleMeasurementInput(input));
            input.addEventListener('blur', () => this.calculateVolume());
        });
        
        this.psaValue.addEventListener('input', () => this.handleMeasurementInput(this.psaValue));
        this.psaValue.addEventListener('blur', () => this.calculatePsaDensity());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                this.generateBefund();
            }
        });
        
        // Initialize assessment with default content
        this.generateAssessment();
        
        console.log('MRI Prostata Befund Generator initialisiert - Alle Probleme behoben');
    }

    handleMeasurementInput(input) {
        // Deutsche Zahlenformatierung (Komma als Dezimaltrennzeichen)
        let value = input.value;
        
        // Nur Zahlen, Komma und Punkt erlauben
        value = value.replace(/[^0-9,.]/g, '');
        
        // Punkt zu Komma konvertieren
        if (value.includes('.') && !value.includes(',')) {
            value = value.replace('.', ',');
        }
        
        // Mehrere Kommas vermeiden
        const commaCount = (value.match(/,/g) || []).length;
        if (commaCount > 1) {
            value = value.substring(0, value.lastIndexOf(','));
        }
        
        input.value = value;
        
        // Echtzeitberechnung
        if (input === this.psaValue) {
            this.calculatePsaDensity();
        } else {
            this.calculateVolume();
        }
    }

    parseGermanNumber(value) {
        if (!value || value.trim() === '') return 0;
        return parseFloat(value.replace(',', '.')) || 0;
    }

    formatGermanNumber(number, decimals = 1) {
        return number.toFixed(decimals).replace('.', ',');
    }

    calculateVolume() {
        const a = this.parseGermanNumber(this.measureA.value);
        const b = this.parseGermanNumber(this.measureB.value);
        const c = this.parseGermanNumber(this.measureC.value);
        
        if (a > 0 && b > 0 && c > 0) {
            this.currentVolume = a * b * c * 0.52;
            this.calculatedVolume.textContent = `${this.formatGermanNumber(this.currentVolume)} ml`;
            this.calculatePsaDensity();
        } else {
            this.currentVolume = 0;
            this.calculatedVolume.textContent = '—';
            this.calculatePsaDensity();
        }
    }

    calculatePsaDensity() {
        const psa = this.parseGermanNumber(this.psaValue.value);
        
        if (psa > 0 && this.currentVolume > 0) {
            this.currentPsaDensity = psa / this.currentVolume;
            this.calculatedPsaDensity.textContent = `${this.formatGermanNumber(this.currentPsaDensity, 2)} ng/ml/ml`;
        } else {
            this.currentPsaDensity = 0;
            this.calculatedPsaDensity.textContent = '—';
        }
    }

    handleKlinischesSettingChange() {
        const isActiveSurveillance = this.klinischesSetting.value === 'Active Surveillance';
        
        // Show/hide PRECISE fields for all existing lesions
        this.lesions.forEach(lesionId => {
            const preciseGroup = document.getElementById(`${lesionId}_precise_group`);
            if (preciseGroup) {
                preciseGroup.style.display = isActiveSurveillance ? 'block' : 'none';
            }
        });
        
        // Regenerate assessment with new logic
        this.generateAssessment();
    }

    generateAssessment() {
        const isActiveSurveillance = this.klinischesSetting.value === 'Active Surveillance';
        
        if (this.lesions.length === 0) {
            // No lesions
            if (isActiveSurveillance) {
                this.assessment.value = 'Bei Active Surveillance eines ISUP Grad 1 Prostatakarzinoms ergibt sich eine komplette Rückbildung vormals verdächtiger MRI-Befunde.';
            } else {
                this.assessment.value = 'Keine suspekten Herdbefunde (PI-RADS 1).';
            }
        } else {
            if (isActiveSurveillance) {
                // Active Surveillance logic
                let assessment = 'Bei Active Surveillance eines ISUP Grad 1 Prostatakarzinoms ergibt sich';
                
                // Find highest PRECISE score
                let highestPrecise = 0;
                let highestPreciseText = '';
                
                this.lesions.forEach(lesionId => {
                    const precise = document.getElementById(`${lesionId}_precise`)?.value || '';
                    if (precise) {
                        let numericPrecise = 0;
                        if (precise === 'X') numericPrecise = 0;
                        else if (precise === '1') numericPrecise = 1;
                        else if (precise === '2') numericPrecise = 2;
                        else if (precise === '3-visible' || precise === '3-non-visible') numericPrecise = 3;
                        else if (precise === '4') numericPrecise = 4;
                        else if (precise === '5') numericPrecise = 5;
                        
                        if (numericPrecise > highestPrecise) {
                            highestPrecise = numericPrecise;
                            highestPreciseText = precise;
                        }
                    }
                });
                
                // Add conclusion based on highest PRECISE score
                switch (highestPrecise) {
                    case 1:
                        assessment += ` eine komplette Rückbildung vormals verdächtiger MRI-Befunde (gesamt PRECISE Score ${highestPreciseText}):`;
                        break;
                    case 2:
                        assessment += ` ein radiologisch regredienter Befund (gesamt PRECISE Score ${highestPreciseText}):`;
                        break;
                    case 3:
                        assessment += ` ein radiologisch stabiler Befund (gesamt PRECISE Score ${highestPreciseText}):`;
                        break;
                    case 4:
                        assessment += ` ein radiologisch progredienter Befund (gesamt PRECISE Score ${highestPreciseText}):`;
                        break;
                    case 5:
                        assessment += ` ein eindeutiger radiologischer Progress (gesamt PRECISE Score ${highestPreciseText}):`;
                        break;
                    default:
                        assessment += ' folgender Befund:';
                        break;
                }
                
                // Add lesion details if any
                if (this.lesions.length > 0) {
                    assessment += '\n';
                    this.lesions.forEach((lesionId, index) => {
                        const lesionNumber = index + 1;
                        const pirads = document.getElementById(`${lesionId}_pirads`)?.value || '';
                        const precise = document.getElementById(`${lesionId}_precise`)?.value || '';
                        
                        // Get location information
                        const zone = this.getMultiSelectValues(`${lesionId}_zone`);
                        const vertical = this.getMultiSelectValues(`${lesionId}_vertical`);
                        const side = document.getElementById(`${lesionId}_side`)?.value || '';
                        const position = this.getMultiSelectValues(`${lesionId}_position`);
                        
                        // Build location string
                        let locationParts = [];
                        if (zone) {
                            if (zone === 'periphere Zone') {
                                locationParts.push('periphere Zone');
                            } else if (zone === 'Übergangszone') {
                                locationParts.push('Transitionalzone');
                            } else {
                                locationParts.push(zone);
                            }
                        }
                        if (side) locationParts.push(side);
                        if (position) locationParts.push(position);
                        if (vertical) locationParts.push(vertical);
                        let location = locationParts.join(' ');
                        
                        // Add lesion line with bullet point
                        assessment += '• ';
                        let lesionDetails = [];
                        if (pirads) lesionDetails.push(`PI-RADS ${pirads}`);
                        if (precise) lesionDetails.push(`PRECISE ${precise}`);
                        if (location) lesionDetails.push(location);
                        
                        if (lesionDetails.length > 0) {
                            assessment += `Läsion #${lesionNumber}: ${lesionDetails.join(', ')}`;
                        } else {
                            assessment += `Läsion #${lesionNumber}`;
                        }
                        
                        // Add newline if not the last lesion
                        if (index < this.lesions.length - 1) {
                            assessment += '\n';
                        }
                    });
                }
                
                this.assessment.value = assessment;
            } else {
                // Primary diagnosis logic (original)
                
                // Find highest PI-RADS score
                let highestPirads = 0;
                this.lesions.forEach(lesionId => {
                    const pirads = document.getElementById(`${lesionId}_pirads`)?.value || '';
                    if (pirads && pirads !== 'X') {
                        const numericPirads = parseInt(pirads);
                        if (numericPirads > highestPirads) {
                            highestPirads = numericPirads;
                        }
                    }
                });
                
                // Check if highest PI-RADS is 2
                if (highestPirads === 2) {
                    this.assessment.value = 'Keine suspekten Herdbefunde (PI-RADS 2).';
                    return;
                }
                
                let assessment = 'Nach PI-RADSv2.1 ergibt sich folgender Befund:\n';
                
                this.lesions.forEach((lesionId, index) => {
                    const lesionNumber = index + 1;
                    const pirads = document.getElementById(`${lesionId}_pirads`)?.value || '';
                    
                    // Get location information
                    const zone = this.getMultiSelectValues(`${lesionId}_zone`);
                    const vertical = this.getMultiSelectValues(`${lesionId}_vertical`);
                    const side = document.getElementById(`${lesionId}_side`)?.value || '';
                    const position = this.getMultiSelectValues(`${lesionId}_position`);
                    
                    // Build location string in correct order: Zone, side, position, vertical
                    let locationParts = [];
                    if (zone) {
                        // Convert to proper German terms
                        if (zone === 'periphere Zone') {
                            locationParts.push('periphere Zone');
                        } else if (zone === 'Übergangszone') {
                            locationParts.push('Transitionalzone');
                        } else {
                            locationParts.push(zone);
                        }
                    }
                    if (side) locationParts.push(side);
                    if (position) locationParts.push(position);
                    if (vertical) locationParts.push(vertical);
                    let location = locationParts.join(' ');
                    
                    // Add lesion line with bullet point
                    assessment += '• ';
                    if (pirads && location) {
                        assessment += `Läsion #${lesionNumber}: PI-RADS ${pirads}, ${location}`;
                    } else if (pirads) {
                        assessment += `Läsion #${lesionNumber}: PI-RADS ${pirads}`;
                    } else if (location) {
                        assessment += `Läsion #${lesionNumber}: ${location}`;
                    } else {
                        assessment += `Läsion #${lesionNumber}`;
                    }
                    
                    // Add newline if not the last lesion
                    if (index < this.lesions.length - 1) {
                        assessment += '\n';
                    }
                });
                
                this.assessment.value = assessment;
            }
        }
    }

    addLesionEventListeners(lesionId) {
        // Add event listeners for fields that affect assessment
        const fieldsToWatch = ['zone', 'vertical', 'side', 'position', 'pirads', 'precise'];
        
        fieldsToWatch.forEach(field => {
            const element = document.getElementById(`${lesionId}_${field}`);
            if (element) {
                element.addEventListener('change', () => {
                    this.generateAssessment();
                });
            }
        });
    }

    addLesion() {
        const lesionIndex = this.lesions.length + 1;
        const lesionId = `lesion_${lesionIndex}`;
        
        const lesionHtml = `
            <div class="lesion-item" id="${lesionId}">
                <div class="lesion-header">
                    <h4 class="lesion-title">Fokale Läsion ${lesionIndex}</h4>
                    ${lesionIndex > 1 ? `<button type="button" class="btn btn--danger btn--sm" onclick="befundGenerator.removeLesion('${lesionId}')">Entfernen</button>` : ''}
                </div>
                <div class="lesion-fields">
                    <!-- Lokalisations-Bereich -->
                    <div class="lesion-section">
                        <h5 class="lesion-section-title">Lokalisation</h5>
                        <div class="form-group">
                            <label class="form-label">Zone: <small>(mehrere möglich)</small></label>
                            <div class="dropdown-checkbox-wrapper" onmouseleave="befundGenerator.autoCollapseDropdown('${lesionId}_zone_group')">
                                <div class="dropdown-checkbox-header" onclick="befundGenerator.toggleCheckboxDropdown('${lesionId}_zone_group')">
                                    <span class="dropdown-checkbox-display" id="${lesionId}_zone_display">Wählen...</span>
                                    <span class="dropdown-arrow">▼</span>
                                </div>
                                <div class="checkbox-group collapsed" id="${lesionId}_zone_group">
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="Transitionalzone" onchange="befundGenerator.updateZoneSelection('${lesionId}')">
                                        <span>Transitionalzone</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="periphere Zone" onchange="befundGenerator.updateZoneSelection('${lesionId}')">
                                        <span>periphere Zone</span>
                                    </label>
                                </div>
                            </div>
                            <input type="hidden" id="${lesionId}_zone" value="">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Seite:</label>
                            <select class="form-control" id="${lesionId}_side">
                                <option value="">Wählen...</option>
                                <option value="links">links</option>
                                <option value="rechts">rechts</option>
                                <option value="bds.">bds.</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Position: <small>(mehrere möglich)</small></label>
                            <div class="dropdown-checkbox-wrapper" onmouseleave="befundGenerator.autoCollapseDropdown('${lesionId}_position_group')">
                                <div class="dropdown-checkbox-header" onclick="befundGenerator.toggleCheckboxDropdown('${lesionId}_position_group')">
                                    <span class="dropdown-checkbox-display" id="${lesionId}_position_display">Wählen...</span>
                                    <span class="dropdown-arrow">▼</span>
                                </div>
                                <div class="checkbox-group collapsed" id="${lesionId}_position_group">
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="postero-medial" onchange="befundGenerator.updatePositionSelection('${lesionId}')">
                                        <span>postero-medial</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="postero-lateral" onchange="befundGenerator.updatePositionSelection('${lesionId}')">
                                        <span>postero-lateral</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="anterior" onchange="befundGenerator.updatePositionSelection('${lesionId}')">
                                        <span>anterior</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="posterior" onchange="befundGenerator.updatePositionSelection('${lesionId}')">
                                        <span>posterior</span>
                                    </label>
                                </div>
                            </div>
                            <input type="hidden" id="${lesionId}_position" value="">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Lokalisation vertikal: <small>(mehrere möglich)</small></label>
                            <div class="dropdown-checkbox-wrapper" onmouseleave="befundGenerator.autoCollapseDropdown('${lesionId}_vertical_group')">
                                <div class="dropdown-checkbox-header" onclick="befundGenerator.toggleCheckboxDropdown('${lesionId}_vertical_group')">
                                    <span class="dropdown-checkbox-display" id="${lesionId}_vertical_display">Wählen...</span>
                                    <span class="dropdown-arrow">▼</span>
                                </div>
                                <div class="checkbox-group collapsed" id="${lesionId}_vertical_group">
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="apikal" onchange="befundGenerator.updateVerticalSelection('${lesionId}')">
                                        <span>apikal</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="midglandulär" onchange="befundGenerator.updateVerticalSelection('${lesionId}')">
                                        <span>midglandulär</span>
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" value="basal" onchange="befundGenerator.updateVerticalSelection('${lesionId}')">
                                        <span>basal</span>
                                    </label>
                                </div>
                            </div>
                            <input type="hidden" id="${lesionId}_vertical" value="">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Serie:</label>
                            <input type="number" class="form-control" id="${lesionId}_serie" placeholder="z.B. 5" min="1" step="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bildnummer:</label>
                            <input type="number" class="form-control" id="${lesionId}_bildnummer" placeholder="z.B. 12" min="1" step="1">
                        </div>
                    </div>
                    
                    <!-- Messungs-Bereich -->
                    <div class="lesion-section">
                        <h5 class="lesion-section-title">Messung</h5>
                        <div class="form-group">
                            <label class="form-label" id="${lesionId}_size_label">Grösse auf ADC in mm:</label>
                            <input type="number" class="form-control" id="${lesionId}_size" placeholder="z.B. 8" min="1" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Messung Serie:</label>
                            <input type="number" class="form-control" id="${lesionId}_messung_serie" placeholder="z.B. 3" min="1" step="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Messung Bildnummer:</label>
                            <input type="number" class="form-control" id="${lesionId}_messung_bildnummer" placeholder="z.B. 8" min="1" step="1">
                        </div>
                    </div>
                    
                    <!-- Signalverhalten-Bereich -->
                    <div class="lesion-section">
                        <h5 class="lesion-section-title">Signalverhalten</h5>
                        <div class="form-group">
                            <label class="form-label">Diffusionsrestriktion:</label>
                            <select class="form-control" id="${lesionId}_diffusion">
                                <option value="">Wählen...</option>
                                <option value="keine">keine</option>
                                <option value="milde">milde</option>
                                <option value="moderate">moderate</option>
                                <option value="deutliche">deutliche</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Arterielles Enhancement:</label>
                            <select class="form-control" id="${lesionId}_enhancement">
                                <option value="">Wählen...</option>
                                <option value="frühes">frühes</option>
                                <option value="kein frühes">kein frühes</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Zusätzliches Signalverhalten:</label>
                            <input type="text" class="form-control" id="${lesionId}_additional" placeholder="z.B. T2 hypointens">
                        </div>
                    </div>
                    
                    <!-- PI-RADS Score-Bereich -->
                    <div class="lesion-section">
                        <h5 class="lesion-section-title">Scores</h5>
                        <div class="form-group">
                            <label class="form-label">PI-RADS:</label>
                            <select class="form-control" id="${lesionId}_pirads">
                                <option value="">Wählen...</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="X">X</option>
                            </select>
                        </div>
                        <div class="form-group" id="${lesionId}_precise_group" style="display: none;">
                            <label class="form-label">PRECISE:</label>
                            <select class="form-control" id="${lesionId}_precise">
                                <option value="">Wählen...</option>
                                <option value="X" title="Insufficient image quality (mpMRI does not meet the agreed PI-QUAL standard and cannot be scored)">X</option>
                                <option value="1" title="Radiologic regression - Complete resolution or a clear reduction in the size/conspicuity of a previously suspicious focus">1</option>
                                <option value="2" title="Minor regression - Lesion remains visible but is smaller and/or less conspicuous than on the prior study">2</option>
                                <option value="3-visible" title="Radiologic stability - 3-V (visible): a PIRADS/Likert ≥ 3 lesion is still visible but shows no meaningful change">3-visible</option>
                                <option value="3-non-visible" title="Radiologic stability - 3-NonV (non-visible): no lesion reaches PIRADS/Likert ≥ 3 on the follow-up scan">3-non-visible</option>
                                <option value="4" title="Probable progression - Marked increase in size or conspicuity of a known lesion, or appearance of a new PIRADS/Likert ≥ 3 lesion while disease remains organ-confined">4</option>
                                <option value="5" title="Definite progression / up-staging - MRI now demonstrates extension beyond the prostate (stage ≥ T3a) or other features that clearly up-stage the tumour">5</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Erste Läsion: "Keine Läsionen" Message entfernen
        if (this.lesions.length === 0) {
            this.lesionsContainer.innerHTML = '';
        }
        
        this.lesionsContainer.insertAdjacentHTML('beforeend', lesionHtml);
        this.lesions.push(lesionId);
        
        // Check if PRECISE field should be shown based on klinisches setting
        const isActiveSurveillance = this.klinischesSetting.value === 'Active Surveillance';
        const preciseGroup = document.getElementById(`${lesionId}_precise_group`);
        if (preciseGroup) {
            preciseGroup.style.display = isActiveSurveillance ? 'block' : 'none';
        }
        
        // Add event listeners for assessment generation
        this.addLesionEventListeners(lesionId);
        
        // Generate assessment
        this.generateAssessment();
        
        this.showStatusMessage(`Läsion ${lesionIndex} hinzugefügt`, 'success');
    }

    removeLesion(lesionId) {
        const element = document.getElementById(lesionId);
        if (element) {
            element.remove();
            this.lesions = this.lesions.filter(id => id !== lesionId);
            
            if (this.lesions.length === 0) {
                this.lesionsContainer.innerHTML = '<div class="no-lesions-message">Keine Läsionen hinzugefügt</div>';
            } else {
                // Läsionsnummern aktualisieren
                this.renumberLesions();
            }
            
            // Regenerate assessment
            this.generateAssessment();
            
            this.showStatusMessage('Läsion entfernt', 'success');
        }
    }

    renumberLesions() {
        const lesionElements = this.lesionsContainer.querySelectorAll('.lesion-item');
        lesionElements.forEach((element, index) => {
            const title = element.querySelector('.lesion-title');
            if (title) {
                title.textContent = `Fokale Läsion ${index + 1}`;
            }
        });
    }

    // Helper function to get selected values from multi-select inputs
    getMultiSelectValues(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return '';
        
        // For hidden inputs that store the combined values
        return element.value || '';
    }

    generateBefund() {
        try {
            this.setLoadingState(true);
            
            // Berechnungen aktualisieren
            this.calculateVolume();
            this.calculatePsaDensity();
            
            // HTML-Befund generieren
            const htmlBefund = this.generateHtmlBefund();
            
            // Create display version with bright text for preview - replace all instances
            const displayVersion = htmlBefund.replaceAll(
                'color: #000;',
                'color: var(--color-text);'
            );
            
            // Store original (black text) version for copying
            this.originalHtmlBefund = htmlBefund;
            
            // Display bright version for preview
            this.befundOutput.innerHTML = displayVersion;
            this.befundOutput.classList.remove('placeholder');
            
            // Plain-Text Version (if element exists)
            if (this.plainOutput) {
                const plainText = this.convertHtmlToPlainText(htmlBefund);
                this.plainOutput.value = plainText;
            } else {
                console.log('ℹ️ Plain output element not found - HTML output only mode');
            }
            
            // Copy-Buttons anzeigen
            this.copyHtmlBtn.classList.remove('hidden');
            this.copyPlainBtn.classList.remove('hidden');
            
            this.showStatusMessage('Befund erfolgreich erstellt!', 'success');
            
        } catch (error) {
            console.error('Fehler beim Generieren:', error);
            this.showStatusMessage('Fehler beim Erstellen des Befunds.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    generateHtmlBefund() {
        // Messungswerte
        const a = this.formatGermanNumber(this.parseGermanNumber(this.measureA.value));
        const b = this.formatGermanNumber(this.parseGermanNumber(this.measureB.value));
        const c = this.formatGermanNumber(this.parseGermanNumber(this.measureC.value));
        const volume = this.formatGermanNumber(this.currentVolume);
        const psaDensity = this.formatGermanNumber(this.currentPsaDensity, 2);
        
        // Parameter
        const piQualValue = this.piQual.value;
        const epeGradeValue = this.epeGrade.value;
        
        // Befund-Sections sammeln
        const neuroText = this.neuroBundle.value || 'Keine Invasion des neurovaskulären Bündels.';
        const vesiclesText = this.seminalVesicles.value || 'Keine Invasion der Samenblase beidseits.';
        const peritoneumText = this.peritoneum.value || 'Keine freie Flüssigkeit.';
        const lymphText = this.lymphNodes.value || 'Keine pathologisch vergrösserten Lymphknoten in den miterfassten Abschnitten.';
        const skeletonText = this.skeleton.value || 'Heterogenes Knochenmarksignal ohne Nachweis suspekter Läsionen. Unauffälliger Weichteilmantel.';
        const incidentalText = this.incidentalFindings.value || 'Keine.';
        const assessmentText = this.assessment.value;
        
        // Voruntersuchungen verarbeiten
        const voruntersuchungenValue = this.voruntersuchungen.value.trim();
        let voruntersuchungenText = '';
        if (voruntersuchungenValue === 'keine' || voruntersuchungenValue === '') {
            voruntersuchungenText = 'Es liegen keine Voruntersuchungen zum Vergleich vor.';
        } else {
            voruntersuchungenText = `Voruntersuchungen: MRI Prostata vom ${voruntersuchungenValue}`;
        }
        
        // HTML Template mit Century Gothic
        let html = `<div style="font-family: 'Century Gothic', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000;">`;
        
        html += `${voruntersuchungenText}<br><br>`;
        
        // Prostatavolumen (kursiv + unterstrichen)
        if (this.currentVolume > 0) {
            html += `<em><u>Prostatavolumen:</u></em> ${a} cm (ap) x ${b} cm (axial) x ${c} cm (cc) x 0,52 = ${volume} ml (<u>Normwert: &lt; 30 ml</u>)<br>`;
        } else {
            html += `<em><u>Prostatavolumen:</u></em> a cm (ap) x b cm (axial) x c cm (cc) x 0,52 = d ml (<u>Normwert: &lt; 30 ml</u>)<br>`;
        }
        
        // PSA Dichte (kursiv + unterstrichen)
        if (this.currentPsaDensity > 0) {
            html += `<em><u>PSA Dichte:</u></em> ${psaDensity} ng/ml/ml<br>`;
        } else {
            html += `<em><u>PSA Dichte:</u></em><br>`;
        }
        
        // Bildqualität (kursiv + unterstrichen)
        html += `<em><u>Bildqualität (PI-QUALv2):</u></em> ${piQualValue || ''}<br><br>`;
        
        // Läsionen generieren
        if (this.lesions.length > 0) {
            this.lesions.forEach((lesionId, index) => {
                const zone = this.getMultiSelectValues(`${lesionId}_zone`);
                const vertical = this.getMultiSelectValues(`${lesionId}_vertical`);
                const side = document.getElementById(`${lesionId}_side`)?.value || '';
                const position = this.getMultiSelectValues(`${lesionId}_position`);
                const serie = document.getElementById(`${lesionId}_serie`)?.value || '';
                const bildnummer = document.getElementById(`${lesionId}_bildnummer`)?.value || '';
                const size = document.getElementById(`${lesionId}_size`)?.value || '';
                const messungSerie = document.getElementById(`${lesionId}_messung_serie`)?.value || '';
                const messungBildnummer = document.getElementById(`${lesionId}_messung_bildnummer`)?.value || '';
                const diffusion = document.getElementById(`${lesionId}_diffusion`)?.value || '';
                const enhancement = document.getElementById(`${lesionId}_enhancement`)?.value || '';
                const additional = document.getElementById(`${lesionId}_additional`)?.value || '';
                const pirads = document.getElementById(`${lesionId}_pirads`)?.value || '';
                const precise = document.getElementById(`${lesionId}_precise`)?.value || '';
                
                // Lokalisation zusammensetzen
                let locationParts = [];
                if (zone) locationParts.push(zone);
                if (vertical) locationParts.push(vertical);
                if (side) locationParts.push(side);
                if (position) locationParts.push(position);
                let location = locationParts.join(', ');
                
                // Serie und Bildnummer für Lokalisation hinzufügen
                if (serie && bildnummer) {
                    location += ` (Serie ${serie}, Bild ${bildnummer})`;
                } else if (serie) {
                    location += ` (Serie ${serie})`;
                } else if (bildnummer) {
                    location += ` (Bild ${bildnummer})`;
                }
                
                // Größe Label basierend auf Zone
                const sizeLabel = zone.includes('Transitionalzone') ? 'Grösse auf T2w' : 'Grösse auf ADC';
                
                // Größe mit Messung Serie/Bildnummer
                let sizeInfo = '';
                if (size) {
                    sizeInfo = `${size} mm`;
                    if (messungSerie && messungBildnummer) {
                        sizeInfo += ` (Serie ${messungSerie}, Bild ${messungBildnummer})`;
                    } else if (messungSerie) {
                        sizeInfo += ` (Serie ${messungSerie})`;
                    } else if (messungBildnummer) {
                        sizeInfo += ` (Bild ${messungBildnummer})`;
                    }
                }
                
                html += `<strong>Fokale Läsion ${index + 1}</strong><br>`;
                html += `<ul>`;
                
                if (location) {
                    html += `<li><em><u>Lokalisation:</u></em> ${location}</li>`;
                }
                
                if (sizeInfo) {
                    html += `<li><em><u>${sizeLabel}:</u></em> ${sizeInfo}</li>`;
                }
                
                let signalverhalten = '';
                if (diffusion) signalverhalten += `${diffusion} Diffusionsrestriktion`;
                if (enhancement) {
                    if (signalverhalten) signalverhalten += ', ';
                    signalverhalten += `${enhancement} arterielles Enhancement`;
                }
                if (additional) {
                    if (signalverhalten) signalverhalten += ', ';
                    signalverhalten += additional;
                }
                
                if (signalverhalten) {
                    html += `<li><em><u>Signalverhalten:</u></em> ${signalverhalten}</li>`;
                }
                
                if (pirads) {
                    html += `<li><em><u><strong>PIRADS:</strong></u></em> <strong>${pirads}</strong></li>`;
                }
                
                if (this.klinischesSetting.value === 'Active Surveillance' && precise) {
                    html += `<li><em><u><strong>PRECISE:</strong></u></em> <strong>${precise}</strong></li>`;
                }
                
                html += `</ul>`;
                
                html += `<br>`;
            });
        }
        
        // EPE (kursiv + unterstrichen)
        html += `<em><u>Extraprostatische Ausdehnung (EPE):</u></em> EPE Grade ${epeGradeValue || ''} (siehe Referenz).<br><br>`;
        
        // Andere Befundabschnitte (alle kursiv + unterstrichen)
        html += `<em><u>Neurovaskuläres Bündel:</u></em> ${neuroText}<br><br>`;
        html += `<em><u>Samenblasen:</u></em> ${vesiclesText}<br><br>`;
        html += `<em><u>Peritoneum:</u></em> ${peritoneumText}<br><br>`;
        html += `<em><u>Lymphknoten:</u></em> ${lymphText}<br><br>`;
        html += `<em><u>Skelett / Weichteile:</u></em> ${skeletonText}<br><br>`;
        html += `<em><u>Nebenbefunde:</u></em> ${incidentalText}<br><br>`;
        
        // Beurteilung (nur fett)
        if (assessmentText) {
            // Make both PI-RADS and PRECISE scores bold, and handle bullet points properly
            let formattedAssessment = assessmentText
                .replace(/PI-RADSv?2\.1/g, '<strong>PI-RADSv2.1</strong>')
                .replace(/PI-RADS (\w+)/g, '<strong>PI-RADS $1</strong>')
                .replace(/PRECISE ([\w-]+)/g, '<strong>PRECISE $1</strong>');
            
            // Convert bullet point lines to proper HTML list
            if (formattedAssessment.includes('• ')) {
                const lines = formattedAssessment.split('\n');
                let result = '';
                let inList = false;
                
                for (const line of lines) {
                    if (line.trim().startsWith('• ')) {
                        if (!inList) {
                            result += '<ul>';
                            inList = true;
                        }
                        result += `<li>${line.trim().substring(2)}</li>`;
                    } else {
                        if (inList) {
                            result += '</ul>';
                            inList = false;
                        }
                        if (line.trim()) {
                            result += line + '<br>';
                        }
                    }
                }
                if (inList) {
                    result += '</ul>';
                }
                formattedAssessment = result;
            } else {
                formattedAssessment = formattedAssessment.replace(/\n/g, '<br>');
            }
            
            html += `<strong>Beurteilung:</strong><br>${formattedAssessment}<br><br>`;
        } else {
            html += `<strong>Beurteilung:</strong><br><br>`;
        }
        
        // Referenzen
        html += `<span style="font-size: 9pt !important; font-style: italic;">Referenzen:<br>`;
        
        // Add PRECISE reference if Active Surveillance is selected
        if (this.klinischesSetting.value === 'Active Surveillance') {
            html += `Englman C., et al. PRECISE Version 2: Updated Recommendations for Reporting Prostate Magnetic Resonance Imaging in Patients on Active Surveillance for Prostate Cancer. Eur Urol. 2024. doi:10.1016/j.eururo.2024.03.014<br>`;
        }
        
        html += `De Rooij M., et al. PI-QUAL version 2: an update of a standardised scoring system for the assessment of image quality of prostate MRI. Eur Radiol. 2024. doi: 10.1007/s00330-024-10795<br>`;
        html += `Mehralivand S, et al. A Grading System for the Assessment of Risk of Extraprostatic Extension of Prostate Cancer at Multiparametric MRI. Radiology. 2019. doi: 10.1148/radiol.2018181278.</span>`;
        
        html += `</div>`;
        
        return html;
    }

    convertHtmlToPlainText(html) {
        // HTML zu Plain-Text konvertieren
        let text = html
            .replace(/<div[^>]*>/gi, '')
            .replace(/<\/div>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?(strong|em|u)>/gi, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/<[^>]*>/g, '')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
        
        return text;
    }

    async copyHtmlToClipboard() {
        try {
            // Use the original black text version for copying
            const htmlContent = this.originalHtmlBefund || this.befundOutput.innerHTML;
            const plainText = this.convertHtmlToPlainText(htmlContent);
            
            // Methode 1: Modernes Clipboard API mit HTML
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const clipboardItem = new ClipboardItem({
                        'text/html': new Blob([htmlContent], { type: 'text/html' }),
                        'text/plain': new Blob([plainText], { type: 'text/plain' })
                    });
                    
                    await navigator.clipboard.write([clipboardItem]);
                    this.showStatusMessage('HTML-formatierter Befund erfolgreich kopiert!', 'success');
                    return;
                } catch (clipboardError) {
                    console.log('ClipboardItem failed, trying fallback:', clipboardError);
                }
            }
            
            // Methode 2: Einfaches Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(plainText);
                    this.showStatusMessage('Befund als Text kopiert (HTML-Format nicht unterstützt)', 'success');
                    return;
                } catch (textError) {
                    console.log('writeText failed, trying execCommand:', textError);
                }
            }
            
            // Methode 3: Legacy execCommand
            this.fallbackCopyToClipboard(plainText);
            this.showStatusMessage('Befund kopiert (Legacy-Methode)', 'success');
            
        } catch (error) {
            console.error('Alle Kopiermethoden fehlgeschlagen:', error);
            this.showStatusMessage('Kopieren fehlgeschlagen. Bitte manuell markieren und kopieren.', 'error');
        }
    }

    async copyPlainToClipboard() {
        try {
            const plainText = this.plainOutput.value;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(plainText);
                this.showStatusMessage('Plain-Text erfolgreich kopiert!', 'success');
            } else {
                this.fallbackCopyToClipboard(plainText);
                this.showStatusMessage('Text kopiert (Legacy-Methode)', 'success');
            }
            
        } catch (error) {
            console.error('Plain text copy failed:', error);
            this.showStatusMessage('Kopieren fehlgeschlagen. Bitte manuell kopieren.', 'error');
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        
        try {
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999); // Für mobile
            
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('execCommand copy failed');
            }
        } finally {
            document.body.removeChild(textArea);
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.generateBtn.classList.add('loading');
            this.generateBtn.disabled = true;
        } else {
            this.generateBtn.classList.remove('loading');
            this.generateBtn.disabled = false;
        }
    }

    showStatusMessage(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.classList.remove('hidden');
        
        // Auto-hide nach 4 Sekunden
        setTimeout(() => {
            this.statusMessage.classList.add('hidden');
        }, 4000);
    }

    // Debugging-Methoden
    validateInputs() {
        const hasAllMeasurements = this.parseGermanNumber(this.measureA.value) > 0 &&
                                 this.parseGermanNumber(this.measureB.value) > 0 &&
                                 this.parseGermanNumber(this.measureC.value) > 0;
        
        const hasPsaValue = this.parseGermanNumber(this.psaValue.value) > 0;
        
        return {
            hasAllMeasurements,
            hasPsaValue,
            canCalculateVolume: hasAllMeasurements,
            canCalculatePsaDensity: hasAllMeasurements && hasPsaValue,
            lesionCount: this.lesions.length
        };
    }

    resetAll() {
        // Messungen zurücksetzen
        this.measureA.value = '';
        this.measureB.value = '';
        this.measureC.value = '';
        this.psaValue.value = '';
        this.calculatedVolume.textContent = '—';
        this.calculatedPsaDensity.textContent = '—';
        
        // Parameter zurücksetzen
        this.piQual.value = '';
        this.epeGrade.value = '';
        
        // Voruntersuchungen zurücksetzen
        this.voruntersuchungen.value = 'keine';
        
        // Läsionen entfernen
        this.lesions = [];
        this.lesionsContainer.innerHTML = '<div class="no-lesions-message">Keine Läsionen hinzugefügt</div>';
        
        // Befundabschnitte auf Normalbefunde zurücksetzen
        this.neuroBundle.value = 'Keine Invasion des neurovaskulären Bündels.';
        this.seminalVesicles.value = 'Keine Invasion der Samenblase beidseits.';
        this.peritoneum.value = 'Keine freie Flüssigkeit.';
        this.lymphNodes.value = 'Keine pathologisch vergrösserten Lymphknoten in den miterfassten Abschnitten.';
        this.skeleton.value = 'Heterogenes Knochenmarksignal ohne Nachweis suspekter Läsionen. Unauffälliger Weichteilmantel.';
        this.incidentalFindings.value = 'Keine.';
        this.assessment.value = '';
        
        // Ausgabe zurücksetzen
        this.befundOutput.innerHTML = '<div class="placeholder-text">Hier wird der formatierte Befund angezeigt …</div>';
        this.plainOutput.value = '';
        this.copyHtmlBtn.classList.add('hidden');
        this.copyPlainBtn.classList.add('hidden');
        
        this.showStatusMessage('Alle Werte zurückgesetzt', 'success');
    }

    toggleCheckboxDropdown(groupId) {
        const group = document.getElementById(groupId);
        const header = group.previousElementSibling;
        const arrow = header.querySelector('.dropdown-arrow');
        
        if (group.classList.contains('collapsed')) {
            group.classList.remove('collapsed');
            arrow.textContent = '▲';
        } else {
            group.classList.add('collapsed');
            arrow.textContent = '▼';
        }
    }

    autoCollapseDropdown(groupId) {
        const group = document.getElementById(groupId);
        const header = group.previousElementSibling;
        const arrow = header.querySelector('.dropdown-arrow');
        
        // Add a small delay to prevent immediate collapse when moving between elements
        setTimeout(() => {
            if (group && !group.classList.contains('collapsed')) {
                group.classList.add('collapsed');
                arrow.textContent = '▼';
            }
        }, 150); // Small delay for better UX
    }

    updateZoneSelection(lesionId) {
        const checkboxes = document.querySelectorAll(`#${lesionId}_zone_group input[type="checkbox"]`);
        const hiddenInput = document.getElementById(`${lesionId}_zone`);
        const displaySpan = document.getElementById(`${lesionId}_zone_display`);
        
        const selectedValues = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        hiddenInput.value = selectedValues.join('/');
        
        // Update display text
        if (selectedValues.length === 0) {
            displaySpan.textContent = 'Wählen...';
        } else if (selectedValues.length === 1) {
            displaySpan.textContent = selectedValues[0];
        } else {
            displaySpan.textContent = `${selectedValues.length} ausgewählt`;
        }
        
        // Update size label logic: Transitionalzone takes priority
        this.updateSizeLabel(lesionId);
        this.generateAssessment();
    }

    updatePositionSelection(lesionId) {
        const checkboxes = document.querySelectorAll(`#${lesionId}_position_group input[type="checkbox"]`);
        const hiddenInput = document.getElementById(`${lesionId}_position`);
        const displaySpan = document.getElementById(`${lesionId}_position_display`);
        
        const selectedValues = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        hiddenInput.value = selectedValues.join('/');
        
        // Update display text
        if (selectedValues.length === 0) {
            displaySpan.textContent = 'Wählen...';
        } else if (selectedValues.length === 1) {
            displaySpan.textContent = selectedValues[0];
        } else {
            displaySpan.textContent = `${selectedValues.length} ausgewählt`;
        }
        
        this.generateAssessment();
    }

    updateVerticalSelection(lesionId) {
        const checkboxes = document.querySelectorAll(`#${lesionId}_vertical_group input[type="checkbox"]`);
        const hiddenInput = document.getElementById(`${lesionId}_vertical`);
        const displaySpan = document.getElementById(`${lesionId}_vertical_display`);
        
        const selectedValues = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        hiddenInput.value = selectedValues.join('/');
        
        // Update display text
        if (selectedValues.length === 0) {
            displaySpan.textContent = 'Wählen...';
        } else if (selectedValues.length === 1) {
            displaySpan.textContent = selectedValues[0];
        } else {
            displaySpan.textContent = `${selectedValues.length} ausgewählt`;
        }
        
        this.generateAssessment();
    }

    updateSizeLabel(lesionId) {
        const zoneHiddenInput = document.getElementById(`${lesionId}_zone`);
        const sizeLabel = document.getElementById(`${lesionId}_size_label`);
        
        if (zoneHiddenInput && sizeLabel) {
            const selectedZones = zoneHiddenInput.value;
            
            // Logic: Transitionalzone -> T2w, periphere Zone -> ADC, both selected -> T2w (Transitionalzone takes priority)
            if (selectedZones.includes('Transitionalzone')) {
                sizeLabel.textContent = 'Grösse auf T2w in mm:';
            } else if (selectedZones.includes('periphere Zone')) {
                sizeLabel.textContent = 'Grösse auf ADC in mm:';
            } else {
                sizeLabel.textContent = 'Grösse auf ADC in mm:'; // Default
            }
        }
    }

    // Test function to create sample images
    createTestImages() {
        console.log('Creating test images...');
        
        // Create a test image for the left side
        const leftTestCanvas = document.createElement('canvas');
        leftTestCanvas.width = 400;
        leftTestCanvas.height = 600;
        const leftCtx = leftTestCanvas.getContext('2d');
        
        // Draw a simple test pattern for left image
        leftCtx.fillStyle = '#ff6b6b';
        leftCtx.fillRect(0, 0, leftTestCanvas.width, leftTestCanvas.height);
        leftCtx.fillStyle = '#ffffff';
        leftCtx.font = '24px Arial';
        leftCtx.textAlign = 'center';
        leftCtx.fillText('LEFT IMAGE', leftTestCanvas.width/2, leftTestCanvas.height/2);
        
        // Create a test image for the right side
        const rightTestCanvas = document.createElement('canvas');
        rightTestCanvas.width = 400;
        rightTestCanvas.height = 600;
        const rightCtx = rightTestCanvas.getContext('2d');
        
        // Draw a simple test pattern for right image
        rightCtx.fillStyle = '#4ecdc4';
        rightCtx.fillRect(0, 0, rightTestCanvas.width, rightTestCanvas.height);
        rightCtx.fillStyle = '#ffffff';
        rightCtx.font = '24px Arial';
        rightCtx.textAlign = 'center';
        rightCtx.fillText('RIGHT IMAGE', rightTestCanvas.width/2, rightTestCanvas.height/2);
        
        // Convert canvases to images
        const leftImg = new Image();
        const rightImg = new Image();
        
        leftImg.onload = () => {
            console.log('Left test image loaded');
            this.setImage(leftImg, 'left');
            this.updatePasteAreaUI('left', leftImg);
        };
        
        rightImg.onload = () => {
            console.log('Right test image loaded');
            this.setImage(rightImg, 'right');
            this.updatePasteAreaUI('right', rightImg);
        };
        
        leftImg.src = leftTestCanvas.toDataURL();
        rightImg.src = rightTestCanvas.toDataURL();
    }
}

// The application is initialized in the consolidated DOMContentLoaded listener at the end of the file

// Globale Fehlerbehandlung
window.addEventListener('error', (event) => {
    console.error('Anwendungsfehler:', event.error);
});

// Clipboard-Berechtigung prüfen
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.permissions) {
        navigator.permissions.query({ name: 'clipboard-write' })
            .then(result => {
                console.log('Clipboard permission:', result.state);
            })
            .catch(() => {
                console.log('Clipboard permission check nicht verfügbar');
            });
    }
});

// PI-RADS Painter Functionality
class PIRADSPainter {
    constructor() {
        this.canvas = safeGetElement('prostateCanvas');
        if (!this.canvas) {
            console.error('PI-RADS Painter: prostateCanvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.virtualStylo = safeGetElement('virtualStylo');
        this.lesionNumberInput = safeGetElement('lesionNumber');
        this.colorInput = safeGetElement('lesionColor');
        
        this.drawing = false;
        this.currentLesion = { number: 1, color: '#51abe4', lineWidth: 3 };
        this.currentTool = 'pen';
        this.selectedLesion = null;
        this.lesions = [];
        this.paths = [];
        this.currentPath = [];
        this.lastX = 0;
        this.lastY = 0;
        this.backgroundColor = '#f8f8f8';
        this.legendBackground = '#FFFEFC';
        this.internalBackground = '#ffffff';

        this.img = new Image();
        this.img.src = 'new_prostate_diagram.png';
        this.imageUrl = 'new_prostate_diagram.png'; // Store URL for export functionality
        
        console.log('🖼️ Attempting to load prostate diagram:', this.img.src);
        
        this.img.onload = () => {
            console.log('✅ Prostate diagram loaded successfully:', this.img.naturalWidth, 'x', this.img.naturalHeight);
            this.canvas.width = this.img.naturalWidth;
            this.canvas.height = this.img.naturalHeight + 80;
            this.redrawCanvas();
        };
        
        // Add error handler for missing image
        this.img.onerror = () => {
            console.warn('⚠️ PI-RADS Painter: Background image not found, using default canvas');
            this.canvas.width = 800;
            this.canvas.height = 680;
            this.createDefaultBackground();
            this.redrawCanvas();
        };

        this.init();
    }
    
    // Create a default background when image is missing
    createDefaultBackground() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw a simple prostate outline
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(this.canvas.width/2, this.canvas.height/2 - 40, 200, 150, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Add text
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Prostate Diagram', this.canvas.width/2, this.canvas.height/2 + 200);
    }

    init() {
        this.setupEventListeners();
        this.setTool('pen');
        this.updateCurrentLesion();
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mouseenter', (e) => {
            this.virtualStylo.style.display = 'block';
            this.updateStylo(e);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.virtualStylo.style.display = 'none';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateStylo(e);
            if (this.drawing) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (this.currentTool === 'eraser') {
                    this.removePathsAtPoint(x, y, 10);
                } else {
                    this.currentPath.push({x, y});
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.lastX, this.lastY);
                    this.ctx.lineTo(x, y);
                    this.ctx.stroke();
                }
                
                this.lastX = x;
                this.lastY = y;
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.drawing = true;
            const rect = this.canvas.getBoundingClientRect();
            this.lastX = e.clientX - rect.left;
            this.lastY = e.clientY - rect.top;

            if (this.currentTool === 'pen') {
                this.currentPath = [{x: this.lastX, y: this.lastY}];
                this.ctx.strokeStyle = this.currentLesion.color;
                this.ctx.lineWidth = this.currentLesion.lineWidth;
                this.ctx.lineCap = 'round';
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.drawing && this.currentTool === 'pen') {
                this.paths.push({
                    points: this.currentPath,
                    color: this.currentLesion.color,
                    lineWidth: this.currentLesion.lineWidth,
                    lesionNumber: this.currentLesion.number
                });
                this.redrawCanvas();
            }
            this.drawing = false;
        });

        // Color input event
        this.colorInput.addEventListener('change', () => {
            this.updateCurrentLesion();
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');
        
        if (tool === 'eraser') {
            this.virtualStylo.style.border = '2px solid black';
            this.virtualStylo.style.background = 'rgba(255,255,255,0.5)';
        } else {
            this.virtualStylo.style.border = 'none';
            this.virtualStylo.style.background = this.currentLesion.color;
        }
    }

    redrawCanvas() {
        // Set background color based on current theme
        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        this.backgroundColor = isDark ? '#1a1a1a' : '#f8f8f8';
        this.legendBackground = isDark ? '#2a2a2a' : '#FFFEFC';
        this.internalBackground = isDark ? '#2a2a2a' : '#ffffff';

        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Only draw image if it's loaded
        if (this.img.complete && this.img.naturalWidth > 0) {
            this.ctx.drawImage(this.img, 0, 0);
        }
        
        this.paths.forEach((pathData) => {
            this.ctx.strokeStyle = pathData.color;
            this.ctx.lineWidth = pathData.lineWidth;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            pathData.points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            this.ctx.stroke();
        });
        
        this.drawLegend();
    }

    drawLegend() {
        const legendWidth = this.canvas.width;
        const imageHeight = (this.img.complete && this.img.naturalWidth > 0) ? this.img.naturalHeight : this.canvas.height - 80;
        const startY = imageHeight + 40;
        const itemWidth = 100;
        const itemsPerRow = Math.min(5, this.lesions.length);
        const totalWidth = itemWidth * itemsPerRow;
        const startX = (legendWidth - totalWidth) / 2;

        this.ctx.fillStyle = this.legendBackground;
        this.ctx.fillRect(0, imageHeight, this.canvas.width, 80);

        const textColor = document.documentElement.getAttribute('data-color-scheme') === 'dark' ? '#ffffff' : '#000000';
        this.ctx.fillStyle = textColor;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Läsionen:', this.canvas.width / 2, imageHeight + 25);

        this.lesions.forEach((lesion, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = startX + (col * itemWidth);
            const y = startY + (row * 25);

            this.ctx.fillStyle = lesion.color;
            this.ctx.fillRect(x, y - 12, 15, 15);

            this.ctx.fillStyle = textColor;
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Läsion ${lesion.number}`, x + 25, y);
        });
    }

    // Simplified export to clipboard - builds the image from scratch
    async exportToClipboard() {
        console.log('📋 Creating combined PI-RADS image for clipboard...');
        this.showExportMessage('PI-RADS wird exportiert...', 'info');

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        const exportCtx = exportCanvas.getContext('2d');

        // Use a promise to handle the async image loading
        const loadImage = new Promise((resolve, reject) => {
            const img = new Image();
            // This is the known URL for the background diagram
            img.src = this.imageUrl; 
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                console.error('❌ Failed to load background image for export:', this.imageUrl);
                reject(err);
            };
        });

        try {
            // 1. Wait for the background image to load
            const backgroundImage = await loadImage;

            // 2. Draw a solid white background to prevent transparency issues
            exportCtx.fillStyle = '#FFFFFF';
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            // 3. Draw the prostate diagram background
            exportCtx.drawImage(backgroundImage, 0, 0, exportCanvas.width, exportCanvas.height);

            // 4. Draw all the user's drawings on top
            if (this.paths && this.paths.length > 0) {
                this.paths.forEach(pathData => {
                    exportCtx.strokeStyle = pathData.color;
                    exportCtx.lineWidth = pathData.lineWidth;
                    exportCtx.lineCap = 'round';
                    exportCtx.beginPath();
                    pathData.points.forEach((point, index) => {
                        if (index === 0) {
                            exportCtx.moveTo(point.x, point.y);
                        } else {
                            exportCtx.lineTo(point.x, point.y);
                        }
                    });
                    exportCtx.stroke();
                });
            }

            // 5. Draw the color legend
            if (typeof this.drawLegend === 'function') {
                this.drawLegend(exportCtx, exportCanvas.width, exportCanvas.height);
            }

            // 6. Convert the final canvas to a blob and copy to clipboard
            exportCanvas.toBlob(async (blob) => {
                if (blob) {
                    await this.copyBlobToClipboard(blob);
                } else {
                    // This error is unlikely if the above steps succeeded
                    throw new Error('Konnte kein Bild-Blob aus dem Canvas erstellen.');
                }
            }, 'image/png');

        } catch (error) {
            console.error('❌ PI-RADS export failed:', error);
            this.showExportMessage(`Export fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`, 'error');
        }
    }

    // Helper to copy blob to clipboard, with user feedback
    async copyBlobToClipboard(blob) {
        if (!navigator.clipboard || !navigator.clipboard.write) {
            this.showExportMessage('Browser unterstützt das Kopieren nicht', 'error');
            return;
        }
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('✅ PI-RADS image copied to clipboard successfully!');
            this.showExportMessage('PI-RADS Bild in Zwischenablage kopiert!', 'success');
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error);
            this.showExportMessage('Kopieren in Zwischenablage fehlgeschlagen', 'error');
        }
    }

    // Show message to the user
    showExportMessage(message, type = 'info') {
        console.log(`💬 Export message: ${message} (${type})`);
        
        // Try to find a status message element or create a temporary one
        let statusElement = document.getElementById('statusMessage');
        
        if (!statusElement) {
            // Create temporary status element
            statusElement = document.createElement('div');
            statusElement.className = 'temp-status-message';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            
            // Set colors based on type
            if (type === 'success') {
                statusElement.style.backgroundColor = '#4CAF50';
                statusElement.style.color = 'white';
            } else if (type === 'error') {
                statusElement.style.backgroundColor = '#f44336';
                statusElement.style.color = 'white';
            } else {
                statusElement.style.backgroundColor = '#2196F3';
                statusElement.style.color = 'white';
            }
            
            document.body.appendChild(statusElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 5000);
        }
        
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.classList.remove('hidden');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 4000);
    }

    // Debug method to check painter state
    debugPainterState() {
        console.log('🔍 ═══════════════════════════════════════');
        console.log('🔍 PI-RADS PAINTER DEBUG STATE');
        console.log('🔍 ═══════════════════════════════════════');
        
        console.log('🎨 Canvas info:', {
            exists: !!this.canvas,
            width: this.canvas ? this.canvas.width : 'N/A',
            height: this.canvas ? this.canvas.height : 'N/A'
        });
        
        console.log('🖼️ Background image info:', {
            exists: !!this.img,
            loaded: this.img ? this.img.complete : false,
            src: this.img ? this.img.src : 'N/A',
            naturalSize: this.img ? `${this.img.naturalWidth}x${this.img.naturalHeight}` : 'N/A'
        });
        
        console.log('🎨 Paths info:', {
            pathsArray: !!this.paths,
            pathCount: this.paths ? this.paths.length : 0,
            paths: this.paths ? this.paths.map((p, i) => ({
                index: i,
                color: p.color,
                lineWidth: p.lineWidth,
                pointCount: p.points ? p.points.length : 0,
                lesionNumber: p.lesionNumber
            })) : []
        });
        
        console.log('🏷️ Lesions info:', {
            lesionsArray: !!this.lesions,
            lesionCount: this.lesions ? this.lesions.length : 0,
            lesions: this.lesions || []
        });
        
        // Test canvas taint status
        if (this.canvas) {
            try {
                this.canvas.toDataURL();
                console.log('🎨 Canvas taint status: ✅ Clean (not tainted)');
            } catch (taintError) {
                console.log('🎨 Canvas taint status: ⚠️ Tainted -', taintError.message);
            }
        }
        
        console.log('🔍 ═══════════════════════════════════════');
        
        return {
            hasCanvas: !!this.canvas,
            hasBackgroundImage: !!(this.img && this.img.complete),
            pathCount: this.paths ? this.paths.length : 0,
            lesionCount: this.lesions ? this.lesions.length : 0,
            canvasTainted: this.canvas ? this.isCanvasTainted() : null
        };
    }

    // Helper method to check if canvas is tainted
    isCanvasTainted() {
        if (!this.canvas) return null;
        
        try {
            this.canvas.toDataURL();
            return false;
        } catch (error) {
            return true;
        }
    }

    removePathsAtPoint(x, y, radius) {
        const newPaths = [];
        let pathsRemoved = false;

        this.paths.forEach(path => {
            let keepPath = true;
            path.points.forEach(point => {
                const distance = Math.sqrt(
                    Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                );
                if (distance < radius) {
                    keepPath = false;
                    pathsRemoved = true;
                }
            });
            if (keepPath) {
                newPaths.push(path);
            }
        });

        if (pathsRemoved) {
            this.paths.length = 0;
            this.paths.push(...newPaths);
            this.redrawCanvas();
        }
    }

    updateStylo(e) {
        const size = this.currentTool === 'eraser' ? 20 : this.currentLesion.lineWidth;
        this.virtualStylo.style.left = (e.clientX - size / 2) + 'px';
        this.virtualStylo.style.top = (e.clientY - size / 2) + 'px';
        this.virtualStylo.style.width = size + 'px';
        this.virtualStylo.style.height = size + 'px';
    }

    updateCurrentLesion() {
        this.currentLesion.color = this.colorInput.value;
        if (this.currentTool !== 'eraser') {
            this.virtualStylo.style.backgroundColor = this.currentLesion.color;
            this.virtualStylo.style.border = 'none';
        }
    }

    addLesion() {
        if (this.selectedLesion !== null) {
            this.lesions[this.selectedLesion] = { ...this.currentLesion };
            this.selectedLesion = null;
        } else {
            this.lesions.push({
                number: this.currentLesion.number,
                color: this.currentLesion.color,
                lineWidth: this.currentLesion.lineWidth
            });
            this.currentLesion.number = parseInt(this.lesionNumberInput.value) + 1;
            this.lesionNumberInput.value = this.currentLesion.number;
            
            const nextColorIndex = (this.colorInput.selectedIndex + 1) % this.colorInput.options.length;
            this.colorInput.selectedIndex = nextColorIndex;
        }
        this.updateCurrentLesion();
        this.redrawCanvas();
    }

    // Reset the painter to initial state
    resetPainter() {
        console.log('🔄 Resetting PI-RADS Painter...');
        
        // Clear all paths and lesions
        this.paths = [];
        this.lesions = [];
        
        // Reset tool to pen
        this.currentTool = 'pen';
        this.setTool('pen');
        
        // Reset current lesion to defaults
        this.currentLesion = { number: 1, color: '#51abe4', lineWidth: 3 };
        
        // Reset UI inputs
        if (this.lesionNumberInput) {
            this.lesionNumberInput.value = 1;
        }
        if (this.colorInput) {
            this.colorInput.selectedIndex = 0; // Reset to first color (blue)
        }
        
        // Clear any selection state
        this.selectedLesion = null;
        this.drawing = false;
        this.currentPath = [];
        
        // Update current lesion styling
        this.updateCurrentLesion();
        
        // Redraw canvas to show clean state
        this.redrawCanvas();
        
        console.log('✅ PI-RADS Painter reset completed');
    }
}

// Global functions for PI-RADS Painter (needed for HTML onclick handlers)
// piradssPainter is initialized at the top of the file

function setTool(tool) {
    if (piradssPainter && typeof piradssPainter.setTool === 'function') {
        piradssPainter.setTool(tool);
    } else {
        console.warn('PI-RADS Painter not initialized or setTool method not available');
    }
}

function addLesion() {
    if (piradssPainter && typeof piradssPainter.addLesion === 'function') {
        piradssPainter.addLesion();
    } else {
        console.warn('PI-RADS Painter not initialized or addLesion method not available');
        // Fallback: try to add lesion to befund generator
        if (befundGenerator && typeof befundGenerator.addLesion === 'function') {
            befundGenerator.addLesion();
        }
    }
}

// Copy PI-RADS painter image to clipboard
function exportPainterImage() {
    console.log('📋 PI-RADS export button clicked');
    if (piradssPainter) {
        piradssPainter.exportToClipboard();
    } else {
        console.error('❌ PI-RADS Painter not initialized');
        alert('PI-RADS Painter ist nicht verfügbar');
    }
}

// Reset PI-RADS painter to initial state
function resetPainter() {
    console.log('🔄 PI-RADS reset button clicked');
    if (piradssPainter && typeof piradssPainter.resetPainter === 'function') {
        piradssPainter.resetPainter();
    } else {
        console.warn('PI-RADS Painter not initialized or resetPainter method not available');
        alert('PI-RADS Painter ist nicht verfügbar');
    }
}

// Paste image from clipboard to specified side
async function pasteFromClipboard(side) {
    console.log(`📋 Paste button clicked for ${side} side`);
    
    if (!imageCombiner) {
        console.error('❌ Image Combiner not initialized');
        alert('Image Combiner ist nicht verfügbar');
        return;
    }
    
    try {
        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⏳ Einfügen...';
        
        if (imageCombiner.clipboardSupport.hasClipboardRead) {
            console.log('🔍 Attempting clipboard read...');
            const clipboardItems = await navigator.clipboard.read();
            
            for (const item of clipboardItems) {
                console.log('📎 Clipboard item types:', item.types);
                
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        console.log(`🖼️ Found image type: ${type}`);
                        const blob = await item.getType(type);
                        imageCombiner.loadImageFromBlob(blob, side);
                        
                        // Reset button
                        button.disabled = false;
                        button.textContent = originalText;
                        return;
                    }
                }
            }
            
            // No image found in clipboard
            console.log('⚠️ No image found in clipboard');
            alert('Kein Bild in der Zwischenablage gefunden');
            
        } else {
            console.log('⚠️ Clipboard API not supported, trying manual method');
            imageCombiner.tryManualClipboardRead(side);
        }
        
    } catch (error) {
        console.error('❌ Clipboard paste error:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('Zwischenablage-Zugriff nicht erlaubt. Bitte verwenden Sie Strg+V oder klicken Sie in den Bereich und fügen Sie mit Strg+V ein.');
        } else {
            alert('Fehler beim Einfügen aus der Zwischenablage. Bitte verwenden Sie Strg+V.');
        }
        
        // Try fallback method
        if (imageCombiner && typeof imageCombiner.tryManualClipboardRead === 'function') {
            imageCombiner.tryManualClipboardRead(side);
        }
    } finally {
        // Reset button state
        const button = event.target;
        if (button && button.disabled) {
            button.disabled = false;
            button.textContent = '📋 Bild aus Zwischenablage einfügen';
        }
    }
}

// Global debugging function for easy access
function debugPainter() {
    console.log('🔍 Global painter debug called');
    if (piradssPainter && typeof piradssPainter.debugPainterState === 'function') {
        return piradssPainter.debugPainterState();
    } else {
        console.warn('PI-RADS Painter not initialized');
        return null;
    }
}

// Global reset function for cross-platform compatibility
function resetApplication() {
    if (confirm('Alle Eingaben zurücksetzen? This will reload the page.')) {
        try {
            if (befundGenerator && typeof befundGenerator.resetAll === 'function') {
                befundGenerator.resetAll();
            } else {
                // Fallback: reload the page
                window.location.reload();
            }
        } catch (error) {
            console.error('Error during reset:', error);
            // Force reload as last resort
            window.location.reload();
        }
    }
}

// PI-RADS Painter initialization is handled in the consolidated DOMContentLoaded listener at the end of the file

// Update canvas on theme change using MutationObserver
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'data-color-scheme' &&
                piradssPainter) {
                piradssPainter.redrawCanvas();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-color-scheme']
    });
}

// Also listen for media query changes
if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (piradssPainter) {
            setTimeout(() => piradssPainter.redrawCanvas(), 100);
        }
    });
}

// ResizableImage Class - Represents a resizable image with handles
class ResizableImage {
    constructor(id, x, y, width, height) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.minWidth = 50;
        this.minHeight = 50;
        this.image = null;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        this.aspectRatio = 1;
        this.selected = false;
        this.handles = this.createHandles();
    }

    createHandles() {
        const handleSize = 8;
        return {
            'nw': { x: this.x - handleSize/2, y: this.y - handleSize/2, size: handleSize, cursor: 'nw-resize' },
            'ne': { x: this.x + this.width - handleSize/2, y: this.y - handleSize/2, size: handleSize, cursor: 'ne-resize' },
            'se': { x: this.x + this.width - handleSize/2, y: this.y + this.height - handleSize/2, size: handleSize, cursor: 'se-resize' },
            'sw': { x: this.x - handleSize/2, y: this.y + this.height - handleSize/2, size: handleSize, cursor: 'sw-resize' },
            'n': { x: this.x + this.width/2 - handleSize/2, y: this.y - handleSize/2, size: handleSize, cursor: 'n-resize' },
            'e': { x: this.x + this.width - handleSize/2, y: this.y + this.height/2 - handleSize/2, size: handleSize, cursor: 'e-resize' },
            's': { x: this.x + this.width/2 - handleSize/2, y: this.y + this.height - handleSize/2, size: handleSize, cursor: 's-resize' },
            'w': { x: this.x - handleSize/2, y: this.y + this.height/2 - handleSize/2, size: handleSize, cursor: 'w-resize' }
        };
    }

    updateHandles() {
        const handleSize = 8;
        this.handles.nw.x = this.x - handleSize/2;
        this.handles.nw.y = this.y - handleSize/2;
        this.handles.ne.x = this.x + this.width - handleSize/2;
        this.handles.ne.y = this.y - handleSize/2;
        this.handles.se.x = this.x + this.width - handleSize/2;
        this.handles.se.y = this.y + this.height - handleSize/2;
        this.handles.sw.x = this.x - handleSize/2;
        this.handles.sw.y = this.y + this.height - handleSize/2;
        this.handles.n.x = this.x + this.width/2 - handleSize/2;
        this.handles.n.y = this.y - handleSize/2;
        this.handles.e.x = this.x + this.width - handleSize/2;
        this.handles.e.y = this.y + this.height/2 - handleSize/2;
        this.handles.s.x = this.x + this.width/2 - handleSize/2;
        this.handles.s.y = this.y + this.height - handleSize/2;
        this.handles.w.x = this.x - handleSize/2;
        this.handles.w.y = this.y + this.height/2 - handleSize/2;
    }

    setImage(img) {
        this.image = img;
        this.naturalWidth = img.naturalWidth;
        this.naturalHeight = img.naturalHeight;
        this.aspectRatio = this.naturalWidth / this.naturalHeight;
        
        // Fit image to current bounds while maintaining aspect ratio
        this.fitToCurrentBounds();
    }

    fitToCurrentBounds() {
        if (!this.image) return;
        
        const aspectRatio = this.aspectRatio;
        const availableWidth = this.width;
        const availableHeight = this.height;
        const originalX = this.x;
        const originalY = this.y;
        
        // For additional screenshots that have been pre-sized to original dimensions, don't resize
        if (this.id.startsWith('screenshot-') && this.id !== 'screenshot-1') {
            // Check if container dimensions match image dimensions (means it was pre-sized)
            if (Math.abs(this.width - this.image.width) < 10 && 
                Math.abs(this.height - this.image.height) < 10) {
                console.log('📏 Skipping resize for pre-sized additional screenshot:', this.id);
                this.updateHandles();
                return;
            }
        }
        
        // For main left/right images and unsized additional screenshots, use aspect ratio fitting
        let newWidth, newHeight;
        
        if (availableWidth / availableHeight > aspectRatio) {
            // Container is wider than image aspect ratio
            newHeight = availableHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            // Container is taller than image aspect ratio
            newWidth = availableWidth;
            newHeight = newWidth / aspectRatio;
        }
        
        // Center the image within the original bounds
        this.x = originalX + (availableWidth - newWidth) / 2;
        this.y = originalY + (availableHeight - newHeight) / 2;
        this.width = newWidth;
        this.height = newHeight;
        
        this.updateHandles();
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }

    getHandleAtPoint(x, y) {
        for (const [type, handle] of Object.entries(this.handles)) {
            if (x >= handle.x && x <= handle.x + handle.size &&
                y >= handle.y && y <= handle.y + handle.size) {
                return { type, handle };
            }
        }
        return null;
    }
}

// Image Combiner Functionality
class ImageCombiner {
    constructor() {
        console.log('🔍 ImageCombiner constructor called - Windows compatibility mode');
        console.log('🌍 Platform detection:', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            isWindows: navigator.platform.toLowerCase().includes('win'),
            isMac: navigator.platform.toLowerCase().includes('mac'),
            vendor: navigator.vendor
        });
        
        this.canvas = document.getElementById('combinedCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.canvasScale = 1;
        
        // Windows compatibility flags
        this.isWindows = navigator.platform.toLowerCase().includes('win');
        this.clipboardSupport = {
            hasClipboardAPI: !!navigator.clipboard,
            hasClipboardRead: !!(navigator.clipboard && navigator.clipboard.read),
            hasClipboardWrite: !!(navigator.clipboard && navigator.clipboard.write),
            hasClipboardItem: !!window.ClipboardItem,
            hasPermissions: !!navigator.permissions
        };
        
        console.log('🔧 Clipboard support detection:', this.clipboardSupport);
        
        // Performance optimizations
        this.lastRedrawTime = 0;
        this.redrawThrottle = 16; // ~60fps
        this.pendingRedraw = false;
        
        // Default canvas dimensions - Y size matches PI-RADS image height (typical dimensions)
        // PI-RADS image is typically around 800x600 + 80 for legend = 680px height
        this.defaultCanvasWidth = 1430;
        this.defaultCanvasHeight = 680; // Hardcoded to match PI-RADS painter image height
        
        // Set initial canvas dimensions
        this.canvas.width = this.defaultCanvasWidth;
        this.canvas.height = this.defaultCanvasHeight;
        
        console.log('📐 Canvas dimensions set:', this.canvas.width, 'x', this.canvas.height);
        
        // Canvas resizing state
        this.canvasResizeHandle = null;
        this.isResizingCanvas = false;
        this.canvasResizeStartState = null;
        
        // Create array to hold multiple images
        this.images = [];
        
        // Create default images (left screenshot + right PI-RADS)
        this.addImage('screenshot-1', 0, 0, this.canvas.width / 2, this.canvas.height);
        this.addImage('pirads', this.canvas.width / 2, 0, this.canvas.width / 2, this.canvas.height);
        
        // Keep references for backwards compatibility
        this.leftImage = this.images[0];
        this.rightImage = this.images[1];
        
        console.log('🖼️ Default images created:', this.images.length);
        console.log('📍 Left image bounds:', this.leftImage.x, this.leftImage.y, this.leftImage.width, this.leftImage.height);
        console.log('📍 Right image bounds:', this.rightImage.x, this.rightImage.y, this.rightImage.width, this.rightImage.height);
        
        // Interaction state
        this.selectedImage = null;
        this.selectedHandle = null;
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.initialImageState = null;
        
        // Windows-specific debugging state
        this.debugMode = true;
        this.pasteAttempts = 0;
        this.successfulPastes = 0;
        this.failedPastes = 0;
        
        console.log('🎯 Canvas found, initializing event listeners...');
        this.initializeEventListeners();
        this.requestClipboardPermissions();
        this.redraw();
        
        // Initialize canvas scale after everything is set up
        this.updateCanvasScale();
        
        console.log('✅ ImageCombiner initialization complete');
        this.logSystemCapabilities();
    }

    // Windows compatibility - system capabilities logging
    logSystemCapabilities() {
        console.log('🔍 System Capabilities Report:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Browser detection
        const browserInfo = this.detectBrowser();
        console.log('🌐 Browser:', browserInfo);
        
        // Canvas support
        console.log('🎨 Canvas support:', {
            canvas2D: !!this.ctx,
            canvasToBlob: !!this.canvas.toBlob,
            canvasToDataURL: !!this.canvas.toDataURL
        });
        
        // File API support
        console.log('📁 File API support:', {
            FileReader: !!window.FileReader,
            FileList: !!window.FileList,
            File: !!window.File,
            Blob: !!window.Blob,
            URL: !!window.URL,
            createObjectURL: !!(window.URL && window.URL.createObjectURL)
        });
        
        // Drag and drop support
        console.log('🎯 Drag & Drop support:', {
            dragEvents: 'ondragstart' in document.createElement('div'),
            dataTransfer: !!window.DataTransfer
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edg')) return 'Edge';
        if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
        return 'Unknown';
    }

    // Windows compatibility - request clipboard permissions explicitly
    async requestClipboardPermissions() {
        if (!this.clipboardSupport.hasPermissions) {
            console.log('⚠️ Permissions API not available - using fallback methods');
            return;
        }

        try {
            const permissions = ['clipboard-read', 'clipboard-write'];
            for (const permission of permissions) {
                try {
                    const result = await navigator.permissions.query({ name: permission });
                    console.log(`🔐 Permission ${permission}:`, result.state);
                    
                    if (result.state === 'prompt') {
                        console.log(`📋 ${permission} will prompt user when needed`);
                    }
                } catch (permError) {
                    console.log(`⚠️ Could not query ${permission} permission:`, permError.message);
                }
            }
        } catch (error) {
            console.log('⚠️ Clipboard permissions check failed:', error.message);
        }
    }

    initializeEventListeners() {
        console.log('🎧 Initializing event listeners with Windows compatibility...');
        
        // Paste area event listeners
        const leftPasteArea = document.getElementById('leftPasteArea');
        const rightPasteArea = document.getElementById('rightPasteArea');
        
        if (leftPasteArea) {
            console.log('📌 Setting up left paste area events');
            
            // Primary paste handler
            leftPasteArea.addEventListener('paste', (e) => {
                console.log('📋 Paste event triggered on left area');
                this.handlePaste(e, 'left');
            });
            
            // Focus handling
            leftPasteArea.addEventListener('click', () => {
                console.log('👆 Left paste area clicked - focusing');
                leftPasteArea.focus();
            });
            
            // Enhanced drag and drop with Windows compatibility
            leftPasteArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                leftPasteArea.classList.add('drag-over');
                console.log('🎯 Drag over left area');
            });
            
            leftPasteArea.addEventListener('dragleave', (e) => {
                // Only remove drag-over if leaving the element entirely
                if (!leftPasteArea.contains(e.relatedTarget)) {
                leftPasteArea.classList.remove('drag-over');
                    console.log('🎯 Drag left area');
                }
            });
            
            leftPasteArea.addEventListener('drop', (e) => {
                e.preventDefault();
                leftPasteArea.classList.remove('drag-over');
                console.log('🎯 Drop event on left area');
                this.handleDrop(e, 'left');
            });

            // Windows-specific: Add keyboard shortcut
            leftPasteArea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                    console.log('⌨️ Keyboard paste shortcut detected');
                    // Trigger paste manually if needed
                    setTimeout(() => {
                        if (this.pasteAttempts === this.successfulPastes + this.failedPastes) {
                            console.log('⚠️ Paste shortcut used but no paste event fired - trying manual clipboard read');
                            this.tryManualClipboardRead('left');
                        }
                    }, 100);
                }
            });
        }
        
        if (rightPasteArea) {
            console.log('📌 Setting up right paste area events');
            
            // Primary paste handler
            rightPasteArea.addEventListener('paste', (e) => {
                console.log('📋 Paste event triggered on right area');
                this.handlePaste(e, 'right');
            });
            
            // Focus handling
            rightPasteArea.addEventListener('click', () => {
                console.log('👆 Right paste area clicked - focusing');
                rightPasteArea.focus();
            });
            
            // Enhanced drag and drop with Windows compatibility
            rightPasteArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                rightPasteArea.classList.add('drag-over');
                console.log('🎯 Drag over right area');
            });
            
            rightPasteArea.addEventListener('dragleave', (e) => {
                // Only remove drag-over if leaving the element entirely
                if (!rightPasteArea.contains(e.relatedTarget)) {
                    rightPasteArea.classList.remove('drag-over');
                    console.log('🎯 Drag left right area');
                }
            });
            
            rightPasteArea.addEventListener('drop', (e) => {
                e.preventDefault();
                rightPasteArea.classList.remove('drag-over');
                console.log('🎯 Drop event on right area');
                this.handleDrop(e, 'right');
            });

            // Windows-specific: Add keyboard shortcut
            rightPasteArea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                    console.log('⌨️ Keyboard paste shortcut detected');
                    // Trigger paste manually if needed
                    setTimeout(() => {
                        if (this.pasteAttempts === this.successfulPastes + this.failedPastes) {
                            console.log('⚠️ Paste shortcut used but no paste event fired - trying manual clipboard read');
                            this.tryManualClipboardRead('right');
                        }
                    }, 100);
                }
            });
        }
        
        // File input fallback with enhanced Windows support
        const fileSelectButton = document.getElementById('fileSelectButton');
        const fileInput = document.getElementById('fileInput');
        
        if (fileSelectButton && fileInput) {
            console.log('📌 Setting up file input fallback');
            
            fileSelectButton.addEventListener('click', () => {
                console.log('👆 File select button clicked');
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                console.log('📁 File input changed');
                const file = e.target.files[0];
                if (file) {
                    console.log('📄 File selected:', {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: new Date(file.lastModified)
                    });
                    this.loadImage(file, 'left');
                } else {
                    console.log('⚠️ No file selected');
                }
            });
        }

        // Canvas mouse events with enhanced debugging
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('🖱️ Mouse down on canvas');
            this.handleMouseDown(e);
        });
        
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                console.log('🖱️ Mouse up - ending drag operation');
            }
            this.handleMouseUp();
        });
        
        // Export button
        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            console.log('📌 Setting up export button');
            exportButton.addEventListener('click', () => {
                console.log('📤 Export button clicked');
                this.exportCombinedImage();
            });
        }
        
        // Update painter button removed - using manual export instead
        
        // Test images button
        const testImagesButton = document.getElementById('testImagesButton');
        if (testImagesButton) {
            console.log('📌 Setting up test images button');
            testImagesButton.addEventListener('click', () => {
                console.log('🧪 Test images button clicked');
                this.createTestImages();
            });
        }
        
        // Add screenshot button
        const addScreenshotButton = document.getElementById('addScreenshotButton');
        if (addScreenshotButton) {
            console.log('📌 Setting up add screenshot button');
            addScreenshotButton.addEventListener('click', () => {
                console.log('➕ Add screenshot button clicked');
                this.addScreenshotArea();
            });
        }
        
        // Canvas size control
        const canvasSize = document.getElementById('canvasSize');
        if (canvasSize) {
            console.log('📌 Setting up canvas size control');
            canvasSize.addEventListener('change', (e) => {
                console.log('📐 Canvas size changed to:', e.target.value);
                this.updateCanvasSize(e.target.value);
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            console.log('🪟 Window resized - updating canvas scale');
            this.updateCanvasScale();
        });

        console.log('✅ All event listeners initialized');
    }

    // Draw virtual grid background for better alignment (display only, not exported)
    drawVirtualGrid() {
        const gridSize = 20; // 20px grid squares
        
        this.ctx.save();
        this.ctx.strokeStyle = '#f0f0f0'; // Very light gray
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.5; // Semi-transparent
        
        this.ctx.beginPath();
        
        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Windows-compatible manual clipboard reading
    async tryManualClipboardRead(side) {
        console.log('🔄 Attempting manual clipboard read for side:', side);
        
        if (!this.clipboardSupport.hasClipboardRead) {
            console.log('❌ Clipboard read API not available');
            this.showPasteError(side, 'Clipboard-Zugriff nicht unterstützt - verwenden Sie Drag & Drop');
            return;
        }

        try {
            const clipboardItems = await navigator.clipboard.read();
            console.log('📋 Clipboard items retrieved:', clipboardItems.length);
            
            for (const item of clipboardItems) {
                console.log('📄 Clipboard item types:', item.types);
                
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        console.log('🖼️ Found image type:', type);
                        try {
                            const blob = await item.getType(type);
                            console.log('💾 Image blob retrieved:', {
                                size: blob.size,
                                type: blob.type
                            });
                            
                            this.loadImageFromBlob(blob, side);
                            return;
                        } catch (blobError) {
                            console.error('❌ Error getting blob from clipboard item:', blobError);
                        }
                    }
                }
            }
            
            console.log('⚠️ No image found in clipboard');
            this.showPasteError(side, 'Kein Bild in der Zwischenablage gefunden');
            
        } catch (error) {
            console.error('❌ Manual clipboard read failed:', error);
            this.showPasteError(side, 'Clipboard-Zugriff fehlgeschlagen: ' + error.message);
        }
    }

    // Enhanced paste handling with Windows compatibility
    handlePaste(e, side) {
        e.preventDefault();
        console.log('📋 ═══════════════════════════════════════');
        console.log('📋 PASTE EVENT STARTED');
        console.log('📋 Side:', side);
        console.log('📋 Timestamp:', new Date().toISOString());
        console.log('📋 ═══════════════════════════════════════');
        
        this.pasteAttempts++;
        console.log('📊 Paste attempt #', this.pasteAttempts);
        
        const pasteArea = this.getPasteAreaElement(side);
        
        if (pasteArea) {
            pasteArea.classList.add('loading');
            console.log('⏳ Loading state set on paste area');
        }
        
        // Enhanced clipboard data inspection
        console.log('🔍 Clipboard data inspection:');
        if (e.clipboardData) {
            console.log('📋 clipboardData exists');
            console.log('📋 files.length:', e.clipboardData.files ? e.clipboardData.files.length : 'undefined');
            console.log('📋 items.length:', e.clipboardData.items ? e.clipboardData.items.length : 'undefined');
            console.log('📋 types:', e.clipboardData.types);
            
            // Log all items
            if (e.clipboardData.items) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    const item = e.clipboardData.items[i];
                    console.log(`📋 Item ${i}:`, {
                        kind: item.kind,
                        type: item.type
                    });
                }
            }
            
            // Log all files
            if (e.clipboardData.files) {
                for (let i = 0; i < e.clipboardData.files.length; i++) {
                    const file = e.clipboardData.files[i];
                    console.log(`📁 File ${i}:`, {
                        name: file.name || 'unnamed',
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified ? new Date(file.lastModified) : 'unknown'
                    });
                }
            }
        } else {
            console.log('❌ No clipboardData available');
        }
        
        let imageFound = false;
        let processingMethod = 'none';
        
        // Method 1: Check clipboardData.files first (Windows often uses this)
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            console.log('🔄 Trying Method 1: clipboardData.files');
            for (let i = 0; i < e.clipboardData.files.length; i++) {
                const file = e.clipboardData.files[i];
                console.log(`📁 Checking file ${i}:`, file.type);
                
                if (file.type.startsWith('image/')) {
                    console.log('✅ Found image file via clipboardData.files');
                    processingMethod = 'files';
                    this.loadImage(file, side);
                    imageFound = true;
                    break;
                }
            }
        }
        
        // Method 2: Check clipboardData.items (more modern approach)
        if (!imageFound && e.clipboardData && e.clipboardData.items && e.clipboardData.items.length > 0) {
            console.log('🔄 Trying Method 2: clipboardData.items');
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                console.log(`📄 Checking item ${i}:`, {
                    kind: item.kind,
                    type: item.type
                });
                
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        console.log('✅ Found image file via clipboardData.items');
                        processingMethod = 'items';
                        this.loadImage(file, side);
                        imageFound = true;
                        break;
                    } else {
                        console.log('⚠️ getAsFile() returned null');
                    }
                }
            }
        }
        
        // Method 3: Try to get image data as string (for some Windows apps)
        if (!imageFound && e.clipboardData && e.clipboardData.items) {
            console.log('🔄 Trying Method 3: text/html or text/plain data URLs');
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.kind === 'string' && (item.type === 'text/html' || item.type === 'text/plain')) {
                    item.getAsString((string) => {
                        console.log('📝 Got string data:', string.substring(0, 100) + '...');
                        
                        // Look for data URLs
                        const dataUrlMatch = string.match(/data:image\/[^;]+;base64,[^"'\s]+/);
                        if (dataUrlMatch) {
                            console.log('✅ Found data URL in string');
                            processingMethod = 'dataurl';
                            const img = new Image();
                            img.onload = () => {
                                console.log('✅ Data URL image loaded');
                                this.setImage(img, side);
                                this.updatePasteAreaUI(side, img);
                                this.redraw();
                            };
                            img.onerror = () => {
                                console.error('❌ Data URL image failed to load');
                                this.showPasteError(side, 'Fehler beim Laden des Bildes aus URL');
                            };
                            img.src = dataUrlMatch[0];
                            imageFound = true;
                        }
                    });
                }
            }
        }
        
        // Handle results
        setTimeout(() => {
            if (imageFound) {
                console.log('✅ Image processing started via method:', processingMethod);
                this.successfulPastes++;
            } else {
                console.log('❌ No image found in clipboard data');
                this.failedPastes++;
                this.showPasteError(side, 'Kein Bild in der Zwischenablage gefunden. Versuchen Sie Drag & Drop oder Datei auswählen.');
                
                // Try fallback on Windows
                if (this.isWindows) {
                    console.log('🔄 Windows detected - trying manual clipboard read as fallback');
                    setTimeout(() => {
                        this.tryManualClipboardRead(side);
                    }, 100);
                }
            }
            
            console.log('📊 Paste statistics:', {
                attempts: this.pasteAttempts,
                successful: this.successfulPastes,
                failed: this.failedPastes,
                successRate: (this.successfulPastes / this.pasteAttempts * 100).toFixed(1) + '%'
            });
            
            console.log('📋 ═══════════════════════════════════════');
            console.log('📋 PASTE EVENT COMPLETED');
            console.log('📋 ═══════════════════════════════════════');
        }, 50);
    }

    // Helper method to get paste area element
    getPasteAreaElement(side) {
        if (side === 'left') {
            return document.getElementById('leftPasteArea');
        } else if (side === 'right') {
            return document.getElementById('rightPasteArea');
        } else {
            return document.getElementById(side + 'PasteArea');
        }
    }

    // Windows-compatible blob loading
    loadImageFromBlob(blob, side) {
        console.log('💾 Loading image from blob:', {
            size: blob.size,
            type: blob.type,
            side: side
        });
        
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            console.log('✅ Blob image loaded successfully:', img.width, 'x', img.height);
            URL.revokeObjectURL(url); // Clean up
            this.setImage(img, side);
            this.updatePasteAreaUI(side, img);
            this.redraw();
        };
        
        img.onerror = () => {
            console.error('❌ Blob image failed to load');
            URL.revokeObjectURL(url); // Clean up
            this.showPasteError(side, 'Fehler beim Laden des Bildes');
        };
        
        img.src = url;
    }

    // Enhanced drag and drop with Windows compatibility
    handleDrop(e, side) {
        console.log('🎯 ═══════════════════════════════════════');
        console.log('🎯 DROP EVENT STARTED');
        console.log('🎯 Side:', side);
        console.log('🎯 ═══════════════════════════════════════');
        
        const files = e.dataTransfer.files;
        const items = e.dataTransfer.items;
        
        console.log('📁 Drop data inspection:');
        console.log('📁 files.length:', files ? files.length : 'undefined');
        console.log('📁 items.length:', items ? items.length : 'undefined');
        console.log('📁 types:', e.dataTransfer.types);
        
        if (files && files.length > 0) {
            console.log('📁 Processing files from drop:');
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`📄 File ${i}:`, {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                
                if (file.type.startsWith('image/')) {
                    console.log('✅ Found image file in drop');
                    this.loadImage(file, side);
                    return;
                }
            }
        }
        
        // Windows compatibility: also check items
        if (items && items.length > 0) {
            console.log('📄 Processing items from drop:');
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`📄 Item ${i}:`, {
                    kind: item.kind,
                    type: item.type
                });
                
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        console.log('✅ Found image file via items');
                        this.loadImage(file, side);
                        return;
                    }
                }
            }
        }
        
        console.log('❌ No valid image file found in drop');
        this.showPasteError(side, 'Keine gültige Bilddatei gefunden');
        
        console.log('🎯 ═══════════════════════════════════════');
        console.log('🎯 DROP EVENT COMPLETED');
        console.log('🎯 ═══════════════════════════════════════');
    }

    // Enhanced image loading with Windows compatibility
    loadImage(file, side) {
        console.log('📤 ═══════════════════════════════════════');
        console.log('📤 LOAD IMAGE STARTED');
        console.log('📤 File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified ? new Date(file.lastModified) : 'unknown'
        });
        console.log('📤 Target side:', side);
        console.log('📤 ═══════════════════════════════════════');
        
        if (!file.type.startsWith('image/')) {
            console.log('❌ File is not an image');
            this.showPasteError(side, 'Datei ist kein Bild');
            return;
        }
        
        // Check file size (Windows might have larger screenshots)
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        if (file.size > maxSize) {
            console.log('⚠️ Large file detected:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            // Don't reject, just warn
        }
        
        const reader = new FileReader();
        
        reader.onloadstart = () => {
            console.log('⏳ FileReader started loading');
        };
        
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total * 100).toFixed(1);
                console.log('📊 FileReader progress:', progress + '%');
            }
        };
        
        reader.onload = (e) => {
            console.log('✅ FileReader completed');
            console.log('📄 Result type:', typeof e.target.result);
            console.log('📄 Result length:', e.target.result.length);
            
            const img = new Image();
            
            img.onload = () => {
                console.log('✅ Image loaded successfully');
                console.log('🖼️ Image dimensions:', img.width, 'x', img.height);
                console.log('🖼️ Natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                
                this.setImage(img, side);
                this.updatePasteAreaUI(side, img);
                this.redraw();
                
                console.log('📤 ═══════════════════════════════════════');
                console.log('📤 LOAD IMAGE COMPLETED SUCCESSFULLY');
                console.log('📤 ═══════════════════════════════════════');
            };
            
            img.onerror = (error) => {
                console.error('❌ Image loading failed:', error);
                console.log('🔍 Image src preview:', e.target.result.substring(0, 100) + '...');
                this.showPasteError(side, 'Fehler beim Laden des Bildes');
                
                console.log('📤 ═══════════════════════════════════════');
                console.log('📤 LOAD IMAGE FAILED');
                console.log('📤 ═══════════════════════════════════════');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
            console.error('❌ FileReader error:', error);
            this.showPasteError(side, 'Fehler beim Lesen der Datei: ' + (error.message || 'Unbekannter Fehler'));
            
            console.log('📤 ═══════════════════════════════════════');
            console.log('📤 LOAD IMAGE FAILED - FILEREADER ERROR');
            console.log('📤 ═══════════════════════════════════════');
        };
        
        console.log('⏳ Starting FileReader.readAsDataURL()');
        reader.readAsDataURL(file);
    }

    handleMouseDown(e) {
        const pos = this.getMousePosition(e);
        
        // Check if clicked on a canvas resize handle
        const canvasHandle = this.getCanvasHandleAtPoint(pos.x, pos.y);
        if (canvasHandle) {
            this.canvasResizeHandle = canvasHandle;
            this.isResizingCanvas = true;
            this.isDragging = true;
            this.dragStartPos = pos;
            this.canvasResizeStartState = {
                width: this.canvas.width,
                height: this.canvas.height
            };
            // Images will maintain their exact position and size during canvas resize
            console.log('Canvas resize started:', this.canvasResizeStartState);
            this.canvas.style.cursor = canvasHandle.cursor;
            e.preventDefault();
            return;
        }
        
        // Check if clicked on a resize handle
        for (const image of this.images) {
            const handle = image.getHandleAtPoint(pos.x, pos.y);
            if (handle) {
                console.log('Clicked on handle:', handle.type, 'for image:', image.id);
                this.selectedHandle = { ...handle, image: image };
                this.isDragging = true;
                this.dragStartPos = pos;
                this.initialImageState = { ...image };
                this.canvas.style.cursor = handle.handle.cursor;
                e.preventDefault();
                return;
            }
        }
        
        // Check if clicked on an image
        for (const image of this.images) {
            if (image.containsPoint(pos.x, pos.y)) {
                console.log('Clicked on image:', image.id);
                this.selectedImage = image;
                // Clear selection from other images
                this.images.forEach(img => img.selected = false);
                image.selected = true;
                this.isDragging = true;
                this.dragStartPos = pos;
                this.initialImageState = { ...image };
                this.canvas.style.cursor = 'move';
                this.redraw();
                e.preventDefault();
                return;
            }
        }
        
        // Clear selection if clicked elsewhere
        this.selectedImage = null;
        this.selectedHandle = null;
        this.canvasResizeHandle = null;
        this.isResizingCanvas = false;
        this.images.forEach(img => img.selected = false);
        this.redraw();
    }

    handleMouseMove(e) {
        if (!this.isDragging) {
            // Update cursor based on hover
            const pos = this.getMousePosition(e);
            this.updateCursor(pos);
            return;
        }
        
        const pos = this.getMousePosition(e);
        const dx = pos.x - this.dragStartPos.x;
        const dy = pos.y - this.dragStartPos.y;
        
        // Only process movement if there's significant change to avoid unnecessary redraws
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            return;
        }
        
        if (this.isResizingCanvas && this.canvasResizeHandle) {
            this.handleCanvasResize(dx, dy, this.canvasResizeHandle.name);
        } else if (this.selectedHandle) {
            this.resizeWithHandle(this.selectedHandle, dx, dy);
        } else if (this.selectedImage) {
            this.moveImage(this.selectedImage, dx, dy);
        }
        
        this.redraw();
    }

    handleMouseUp() {
        const wasResizingCanvas = this.isResizingCanvas;
        
        this.isDragging = false;
        this.selectedImage = null;
        this.selectedHandle = null;
        this.canvasResizeHandle = null;
        this.isResizingCanvas = false;
        this.initialImageState = null;
        this.canvasResizeStartState = null;
        this.canvas.style.cursor = 'default';
        
        // Only update canvas scale for non-canvas-resize operations
        // Canvas resize operations shouldn't trigger scale updates
        if (!wasResizingCanvas) {
            this.updateCanvasScale();
        } else {
            console.log('🎯 Canvas resize completed - scale update skipped to prevent scaling artifacts');
        }
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Professional coordinate calculation - consistent for all operations
        // This ensures pixel-perfect mouse interaction regardless of operation type
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        return { x, y };
    }

   

    updateCursor(pos) {
        const canvasHandle = this.getCanvasHandleAtPoint(pos.x, pos.y);
        
        if (canvasHandle) {
            this.canvas.style.cursor = canvasHandle.cursor;
            return;
        }
        
        // Check for image handles
        for (const image of this.images) {
            const handle = image.getHandleAtPoint(pos.x, pos.y);
            if (handle) {
                this.canvas.style.cursor = handle.handle.cursor;
                return;
            }
        }
        
        // Check if over any image
        for (const image of this.images) {
            if (image.containsPoint(pos.x, pos.y)) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        this.canvas.style.cursor = 'default';
    }

    resizeWithHandle(handleInfo, dx, dy) {
        const image = handleInfo.image;
        const handleType = handleInfo.type;
        const minSize = 50;
        
        // Store original values
        const originalX = this.initialImageState.x;
        const originalY = this.initialImageState.y;
        const originalWidth = this.initialImageState.width;
        const originalHeight = this.initialImageState.height;
        
        let newX = originalX;
        let newY = originalY;
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        // Calculate new dimensions based on handle type
        switch(handleType) {
            case 'nw':
                newX = originalX + dx;
                newY = originalY + dy;
                newWidth = originalWidth - dx;
                newHeight = originalHeight - dy;
                break;
            case 'ne':
                newY = originalY + dy;
                newWidth = originalWidth + dx;
                newHeight = originalHeight - dy;
                break;
            case 'se':
                newWidth = originalWidth + dx;
                newHeight = originalHeight + dy;
                break;
            case 'sw':
                newX = originalX + dx;
                newWidth = originalWidth - dx;
                newHeight = originalHeight + dy;
                break;
            case 'n':
                newY = originalY + dy;
                newHeight = originalHeight - dy;
                break;
            case 'e':
                newWidth = originalWidth + dx;
                break;
            case 's':
                newHeight = originalHeight + dy;
                break;
            case 'w':
                newX = originalX + dx;
                newWidth = originalWidth - dx;
                break;
        }
        
        // Maintain aspect ratio when resizing from corners
        if (['nw', 'ne', 'se', 'sw'].includes(handleType) && image.image) {
            const aspectRatio = image.aspectRatio;
            
            if (handleType === 'nw' || handleType === 'se') {
                // Resize based on width, adjust height
                newHeight = newWidth / aspectRatio;
                if (handleType === 'nw') {
                    newY = originalY + originalHeight - newHeight;
                }
            } else {
                // Resize based on height, adjust width
                newWidth = newHeight * aspectRatio;
                if (handleType === 'ne') {
                    newY = originalY + originalHeight - newHeight;
                }
            }
        }
        
        // Apply minimum size constraints
        if (newWidth >= minSize && newHeight >= minSize) {
            image.x = newX;
            image.y = newY;
            image.width = newWidth;
            image.height = newHeight;
            
            // Only constrain if not resizing canvas
            if (!this.isResizingCanvas) {
                this.constrainImageToCanvas(image);
            }
        }
    }

    moveImage(image, dx, dy) {
        const newX = this.initialImageState.x + dx;
        const newY = this.initialImageState.y + dy;
        
        image.x = newX;
        image.y = newY;
        
        // Only constrain if not resizing canvas
        if (!this.isResizingCanvas) {
            this.constrainImageToCanvas(image);
        }
    }

    redraw() {
        // Use throttled redraw for better performance
        this.scheduleRedraw();
    }

    scheduleRedraw() {
        if (this.pendingRedraw) return;
        
        this.pendingRedraw = true;
        requestAnimationFrame(() => {
            this.performRedraw();
            this.pendingRedraw = false;
        });
    }

    performRedraw() {
        // CRITICAL: Reset transformation matrix to prevent scaling artifacts
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw virtual grid background (display only, not exported)
        this.drawVirtualGrid();
        
        // Draw center divider line (only if we have exactly 2 images in default layout)
        if (this.images.length === 2) {
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, 0);
            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw all images at their exact positions and sizes (no scaling)
        for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            if (image.image) {
                this.drawImage(image);
            } else {
                // Show placeholder for empty image slots
                let placeholderText = 'Screenshot einfügen';
                if (image.id === 'pirads') {
                    placeholderText = 'PI-RADS Painter';
                } else if (image.id.startsWith('screenshot-') && image.id !== 'screenshot-1') {
                    placeholderText = `Screenshot ${i + 1}`;
                }
                this.drawPlaceholder(image.x, image.y, image.width, image.height, placeholderText);
            }
        }
        
        // Draw canvas resize handles
        this.drawCanvasResizeHandles();
        
        // Note: Canvas scale calculation is separate from content rendering
        // updateCanvasScale is only called when needed and doesn't affect image content
    }

    drawImage(resizableImage) {
        if (!resizableImage.image) return;
        
        // Draw the image
        this.ctx.drawImage(
            resizableImage.image,
            resizableImage.x,
            resizableImage.y,
            resizableImage.width,
            resizableImage.height
        );
        
        // Draw border with different colors for different image types
        let borderColor = '#cccccc';
        if (resizableImage.selected) {
            borderColor = '#51abe4';
        } else if (resizableImage.id === 'pirads') {
            borderColor = '#4ecdc4'; // Teal for PI-RADS
        } else if (resizableImage.id.startsWith('screenshot-') && resizableImage.id !== 'screenshot-1') {
            borderColor = '#ff6b6b'; // Red for additional screenshots (for debugging)
        }
        
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = resizableImage.selected ? 3 : 2;
        this.ctx.strokeRect(
            resizableImage.x,
            resizableImage.y,
            resizableImage.width,
            resizableImage.height
        );
        
        // Draw resize handles only if selected or if no image is selected
        const anyImageSelected = this.images.some(img => img.selected);
        if (resizableImage.selected || !anyImageSelected) {
            this.drawHandles(resizableImage);
        }
    }

    drawHandles(resizableImage) {
        const handleColor = resizableImage.selected ? '#51abe4' : '#999999';
        this.ctx.fillStyle = handleColor;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw all handles in one batch to reduce context switching
        this.ctx.beginPath();
        for (const [type, handle] of Object.entries(resizableImage.handles)) {
            this.ctx.rect(handle.x, handle.y, handle.size, handle.size);
        }
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPlaceholder(x, y, width, height, text) {
        // Draw placeholder background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(x, y, width, height);
        
        // Draw border
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([15, 10]);
        this.ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
        this.ctx.setLineDash([]);
        
        // Draw placeholder text
        this.ctx.fillStyle = '#6c757d';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
        
        // Draw icon
        this.ctx.font = '48px Arial';
        this.ctx.fillText(text.includes('Screenshot') ? '📋' : '🎨', x + width / 2, y + height / 2 - 50);
    }

    updateCanvasScale() {
        if (!this.canvas) return;
        
        // Don't update scale during canvas resize operations to prevent interference
        if (this.isResizingCanvas) {
            console.log('📐 Skipping canvas scale update during resize - preventing scaling artifacts');
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const newScale = rect.width / this.canvas.width;
        
        // Only update if there's a significant change to avoid unnecessary calculations
        if (Math.abs(newScale - this.canvasScale) > 0.01) {
            this.canvasScale = newScale;
            console.log('📏 Canvas scale updated for UI interaction only:', {
                displaySize: `${rect.width}x${rect.height}`,
                canvasSize: `${this.canvas.width}x${this.canvas.height}`,
                scale: this.canvasScale,
                note: 'This affects mouse interaction only, not image rendering'
            });
        }
    }



    handleDrop(e, side) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            for (let file of files) {
                if (file.type.startsWith('image/')) {
                    this.loadImage(file, side);
                    return;
                }
            }
        }
        this.showPasteError(side, 'Keine gültige Bilddatei gefunden');
    }

    loadImage(file, side) {
        console.log('Loading image file:', file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
            this.showPasteError(side, 'Datei ist kein Bild');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                console.log('Image loaded successfully:', img.width, 'x', img.height);
                this.setImage(img, side);
                this.updatePasteAreaUI(side, img);
                this.redraw();
            };
            img.onerror = () => {
                this.showPasteError(side, 'Fehler beim Laden des Bildes');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showPasteError(side, 'Fehler beim Lesen der Datei');
        };
        reader.readAsDataURL(file);
    }

    setImage(img, side) {
        console.log('🖼️ ═══════════════════════════════════════');
        console.log('🖼️ SET IMAGE STARTED');
        console.log('🖼️ Side:', side);
        console.log('🖼️ Image dimensions:', img.width, 'x', img.height);
        console.log('🖼️ Current images array length:', this.images.length);
        console.log('🖼️ ═══════════════════════════════════════');
        
        let targetImage;
        
        if (side === 'left') {
            targetImage = this.leftImage; // First image (backwards compatibility)
            console.log('🎯 Target: Left image (backwards compatibility)');
        } else if (side === 'right') {
            targetImage = this.rightImage; // Second image (PI-RADS)
            console.log('🎯 Target: Right image (PI-RADS)');
        } else if (typeof side === 'string' && side.startsWith('screenshot-')) {
            targetImage = this.getImageById(side);
            console.log('🎯 Target: Screenshot by ID:', side, 'found:', !!targetImage);
        } else {
            // Find first available screenshot slot
            targetImage = this.images.find(image => 
                image.id.startsWith('screenshot-') && !image.image
            );
            console.log('🎯 Target: First available screenshot slot:', !!targetImage);
            
            if (!targetImage) {
                // Create new screenshot area if none available
                console.log('🆕 Creating new screenshot area');
                targetImage = this.addScreenshotArea();
            }
        }
        
        if (!targetImage) {
            console.error('❌ Failed to find or create target image container');
            return;
        }
        
        console.log('📦 Target image container:', {
            id: targetImage.id,
            currentBounds: `${targetImage.x},${targetImage.y} ${targetImage.width}x${targetImage.height}`,
            hasExistingImage: !!targetImage.image
        });
        
        // For additional screenshots, resize container to match original image size
        if (targetImage.id.startsWith('screenshot-') && targetImage.id !== 'screenshot-1') {
            console.log('📏 Resizing additional screenshot container to original image size');
            
            // Keep current position but update size to match image
            targetImage.width = img.width;
            targetImage.height = img.height;
            
            // Calculate required canvas height to fit this image
            const requiredHeight = targetImage.y + targetImage.height + 20; // 20px margin
            
            // Auto-expand canvas if needed
            if (requiredHeight > this.canvas.height) {
                console.log(`📐 Auto-expanding canvas for original size image: ${this.canvas.height} → ${requiredHeight}`);
                this.canvas.height = requiredHeight;
            }
            
            console.log('📦 Updated container size:', {
                id: targetImage.id,
                newBounds: `${targetImage.x},${targetImage.y} ${targetImage.width}x${targetImage.height}`,
                originalImageSize: `${img.width}x${img.height}`,
                canvasHeight: this.canvas.height
            });
        }
        
        // Set the image
        targetImage.setImage(img);
        
        console.log('✅ Image set successfully');
        console.log('📊 Final image state:', {
            id: targetImage.id,
            finalBounds: `${targetImage.x},${targetImage.y} ${targetImage.width}x${targetImage.height}`,
            aspectRatio: targetImage.aspectRatio
        });
        
        // Show combined section if we have at least one screenshot and PI-RADS
        const hasScreenshot = this.images.some(img => 
            img.id.startsWith('screenshot-') && img.image
        );
        const hasPiRads = this.rightImage && this.rightImage.image;
        
        console.log('📊 Image status check:', {
            hasScreenshot: hasScreenshot,
            hasPiRads: hasPiRads,
            totalImages: this.images.length,
            imagesWithData: this.images.filter(i => i.image).length
        });
        
        if (hasScreenshot && hasPiRads) {
            const combinedSection = document.getElementById('combinedSection');
            const exportSection = document.getElementById('exportSection');
            
            if (combinedSection) {
                combinedSection.classList.remove('hidden');
                console.log('✅ Combined section shown');
            }
            if (exportSection) {
                exportSection.classList.remove('hidden');
                console.log('✅ Export section shown');
            }
        }
        
        console.log('🖼️ ═══════════════════════════════════════');
        console.log('🖼️ SET IMAGE COMPLETED');
        console.log('🖼️ ═══════════════════════════════════════');
    }

    updatePasteAreaUI(side, img) {
        console.log('🎨 Updating paste area UI for side:', side);
        
        let pasteArea, imageInfo, previewCanvas;
        
        if (side === 'left') {
            pasteArea = document.getElementById('leftPasteArea');
            imageInfo = document.getElementById('leftImageInfo');
            previewCanvas = document.getElementById('leftPreview');
        } else if (side === 'right') {
            pasteArea = document.getElementById('rightPasteArea');
            imageInfo = document.getElementById('rightImageInfo');
            previewCanvas = document.getElementById('rightPreview');
        } else {
            // Handle additional screenshot areas
            pasteArea = document.getElementById(side + 'PasteArea');
            imageInfo = document.getElementById(side + 'ImageInfo');
            previewCanvas = document.getElementById(side + 'Preview');
        }
        
        console.log('🎨 UI elements found:', {
            pasteArea: !!pasteArea,
            imageInfo: !!imageInfo,
            previewCanvas: !!previewCanvas
        });
        
        if (pasteArea) {
            pasteArea.classList.remove('loading');
            pasteArea.classList.add('has-image');
            console.log('✅ Paste area updated - loading removed, has-image added');
        }
        
        if (imageInfo) {
            const infoText = `${img.width} × ${img.height} Pixel`;
            imageInfo.textContent = infoText;
            imageInfo.style.color = ''; // Reset any error color
            console.log('📝 Image info updated:', infoText);
        }
        
        if (previewCanvas) {
            try {
                // Calculate preview dimensions maintaining aspect ratio
                const maxPreviewWidth = 300;
                const aspectRatio = img.width / img.height;
                
                let previewWidth, previewHeight;
                if (img.width > img.height) {
                    previewWidth = Math.min(maxPreviewWidth, img.width);
                    previewHeight = previewWidth / aspectRatio;
                } else {
                    previewHeight = Math.min(maxPreviewWidth, img.height);
                    previewWidth = previewHeight * aspectRatio;
                }
                
                previewCanvas.width = previewWidth;
                previewCanvas.height = previewHeight;
                
            const previewCtx = previewCanvas.getContext('2d');
                
                // Windows compatibility: ensure smooth scaling
                if (this.isWindows) {
                    previewCtx.imageSmoothingEnabled = true;
                    previewCtx.imageSmoothingQuality = 'high';
                }
                
                previewCtx.drawImage(img, 0, 0, previewWidth, previewHeight);
            previewCanvas.classList.remove('hidden');
                
                console.log('🖼️ Preview canvas updated:', previewWidth, 'x', previewHeight);
            } catch (previewError) {
                console.error('❌ Preview canvas update failed:', previewError);
                // Don't show preview if it fails, but don't break the whole process
            }
        }
    }

    showPasteError(side, message) {
        console.log('❌ Showing paste error for side:', side, 'Message:', message);
        
        let pasteArea, imageInfo;
        
        if (side === 'left') {
            pasteArea = document.getElementById('leftPasteArea');
            imageInfo = document.getElementById('leftImageInfo');
        } else if (side === 'right') {
            pasteArea = document.getElementById('rightPasteArea');
            imageInfo = document.getElementById('rightImageInfo');
        } else {
            // Handle additional screenshot areas
            pasteArea = document.getElementById(side + 'PasteArea');
            imageInfo = document.getElementById(side + 'ImageInfo');
        }
        
        if (pasteArea) {
            pasteArea.classList.remove('loading');
            console.log('⏳ Loading state removed from paste area');
        }
        
        if (imageInfo) {
            imageInfo.textContent = message;
            imageInfo.style.color = 'var(--color-error)';
            console.log('💬 Error message displayed in UI');
        }
        
        // Windows compatibility: provide additional guidance
        if (this.isWindows && message.includes('Zwischenablage')) {
            console.log('💡 Adding Windows-specific guidance');
            
            // Show additional help for Windows users
        setTimeout(() => {
                if (imageInfo && imageInfo.textContent === message) {
                    imageInfo.innerHTML = `${message}<br><small>Windows-Tipp: Verwenden Sie Snipping Tool oder Drucken + Windows-Taste</small>`;
                }
            }, 1000);
        }
        
        // Auto-clear error after 5 seconds (longer for Windows users)
        const clearTimeout = this.isWindows ? 7000 : 5000;
        setTimeout(() => {
            if (imageInfo && imageInfo.style.color === 'var(--color-error)') {
                imageInfo.textContent = '';
                imageInfo.style.color = '';
                imageInfo.innerHTML = ''; // Clear any HTML content
                console.log('🧹 Error message cleared');
            }
        }, clearTimeout);
    }

    // Mouse event handlers with Windows compatibility
    handleMouseDown(e) {
        console.log('🖱️ Mouse down event - Windows compatibility mode');
        
        const pos = this.getMousePosition(e);
        console.log('📍 Mouse position:', pos);
        
        // Windows compatibility: handle different mouse button behaviors
        if (e.button !== 0) { // Only handle left mouse button
            console.log('🖱️ Ignoring non-left mouse button:', e.button);
            return;
        }
        
        // Check if clicked on a canvas resize handle
        const canvasHandle = this.getCanvasHandleAtPoint(pos.x, pos.y);
        if (canvasHandle) {
            console.log('🎯 Canvas resize handle clicked:', canvasHandle.name);
            this.canvasResizeHandle = canvasHandle;
            this.isResizingCanvas = true;
            this.isDragging = true;
            this.dragStartPos = pos;
            this.canvasResizeStartState = {
                width: this.canvas.width,
                height: this.canvas.height
            };
            console.log('📐 Canvas resize started from:', this.canvasResizeStartState);
            this.canvas.style.cursor = canvasHandle.cursor;
            e.preventDefault();
            return;
        }
        
        // Check if clicked on a resize handle
        for (const image of this.images) {
            const handle = image.getHandleAtPoint(pos.x, pos.y);
            if (handle) {
                console.log('🎯 Image resize handle clicked:', {
                    handleType: handle.type,
                    imageId: image.id,
                    imageBounds: `${image.x},${image.y} ${image.width}x${image.height}`
                });
                
                this.selectedHandle = { ...handle, image: image };
                this.isDragging = true;
                this.dragStartPos = pos;
                this.initialImageState = { ...image };
                this.canvas.style.cursor = handle.handle.cursor;
                e.preventDefault();
                return;
            }
        }
        
        // Check if clicked on an image
        for (const image of this.images) {
            if (image.containsPoint(pos.x, pos.y)) {
                console.log('🖼️ Image clicked:', {
                    imageId: image.id,
                    hasImage: !!image.image,
                    bounds: `${image.x},${image.y} ${image.width}x${image.height}`
                });
                
                this.selectedImage = image;
                // Clear selection from other images
                this.images.forEach(img => img.selected = false);
                image.selected = true;
                this.isDragging = true;
                this.dragStartPos = pos;
                this.initialImageState = { ...image };
                this.canvas.style.cursor = 'move';
                this.redraw();
                e.preventDefault();
                return;
            }
        }
        
        // Clear selection if clicked elsewhere
        console.log('🖱️ Clicked on empty canvas - clearing selection');
        this.selectedImage = null;
        this.selectedHandle = null;
        this.canvasResizeHandle = null;
        this.isResizingCanvas = false;
        this.images.forEach(img => img.selected = false);
        this.redraw();
    }

    handleMouseMove(e) {
        if (!this.isDragging) {
            // Update cursor based on hover
            const pos = this.getMousePosition(e);
            this.updateCursor(pos);
            return;
        }
        
        const pos = this.getMousePosition(e);
        const dx = pos.x - this.dragStartPos.x;
        const dy = pos.y - this.dragStartPos.y;
        
        // Windows compatibility: use higher threshold to prevent jittery movement
        const moveThreshold = this.isWindows ? 2 : 1;
        if (Math.abs(dx) < moveThreshold && Math.abs(dy) < moveThreshold) {
            return;
        }
        
        if (this.isResizingCanvas && this.canvasResizeHandle) {
            console.log('📐 Canvas resize in progress:', {
                handle: this.canvasResizeHandle.name,
                delta: `${dx},${dy}`
            });
            this.handleCanvasResize(dx, dy, this.canvasResizeHandle.name);
        } else if (this.selectedHandle) {
            console.log('🔧 Image resize in progress:', {
                imageId: this.selectedHandle.image.id,
                handleType: this.selectedHandle.type,
                delta: `${dx},${dy}`
            });
            this.resizeWithHandle(this.selectedHandle, dx, dy);
        } else if (this.selectedImage) {
            console.log('📦 Image move in progress:', {
                imageId: this.selectedImage.id,
                delta: `${dx},${dy}`
            });
            this.moveImage(this.selectedImage, dx, dy);
        }
        
        this.redraw();
    }

    handleMouseUp() {
        if (this.isDragging) {
            console.log('🖱️ Mouse up - ending drag operation');
            console.log('📊 Operation summary:', {
                wasResizingCanvas: this.isResizingCanvas,
                hadSelectedHandle: !!this.selectedHandle,
                hadSelectedImage: !!this.selectedImage
            });
        }
        
        this.isDragging = false;
        this.selectedImage = null;
        this.selectedHandle = null;
        this.canvasResizeHandle = null;
        this.isResizingCanvas = false;
        this.initialImageState = null;
        this.canvasResizeStartState = null;
        this.canvas.style.cursor = 'default';
        
        // Update canvas scale after resize operations complete
        this.updateCanvasScale();
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Professional coordinate calculation - consistent for all operations
        // Windows compatibility: handle DPI scaling with professional approach
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Windows debugging: log detailed position information
        if (this.debugMode && this.isDragging) {
            console.log('📍 Professional mouse position calculation:', {
                clientPos: `${e.clientX},${e.clientY}`,
                rectPos: `${rect.left},${rect.top}`,
                rectSize: `${rect.width}x${rect.height}`,
                canvasSize: `${this.canvas.width}x${this.canvas.height}`,
                scale: `${scaleX},${scaleY}`,
                finalPos: `${x},${y}`,
                operation: this.isResizingCanvas ? 'canvas-resize' : 'normal'
            });
        }
        
        return { x, y };
    }

    updateCanvasScale() {
        if (!this.canvas) return;
        
        // Don't update scale during canvas resize operations to prevent interference
        if (this.isResizingCanvas) {
            console.log('📐 Skipping canvas scale update during resize operation');
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const newScale = rect.width / this.canvas.width;
        
        if (Math.abs(newScale - this.canvasScale) > 0.01) { // Only update if significant change
            this.canvasScale = newScale;
            console.log('📏 Canvas scale updated:', {
                displaySize: `${rect.width}x${rect.height}`,
                canvasSize: `${this.canvas.width}x${this.canvas.height}`,
                scale: this.canvasScale
            });
        }
    }



    // Enhanced export with Windows compatibility
    async exportCombinedImage() {
        console.log('📤 ═══════════════════════════════════════');
        console.log('📤 EXPORT COMBINED IMAGE STARTED');
        console.log('📤 Windows compatibility mode:', this.isWindows);
        console.log('📤 ═══════════════════════════════════════');
        
        try {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.textContent = 'Preparing image for export...';
                statusMessage.className = 'status-message info';
            }
            
            // Create final canvas at current size
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = this.canvas.width;
            exportCanvas.height = this.canvas.height;
            const exportCtx = exportCanvas.getContext('2d');
            
            console.log('🎨 Export canvas created:', exportCanvas.width, 'x', exportCanvas.height);
            
            // Windows compatibility: set up proper rendering context
            if (this.isWindows) {
                exportCtx.imageSmoothingEnabled = true;
                exportCtx.imageSmoothingQuality = 'high';
                console.log('🪟 Windows-specific canvas settings applied');
            }
            
            // Fill with white background (NO GRID for export)
            exportCtx.fillStyle = 'white';
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            console.log('⚪ White background applied (no grid for export)');
            
            // Draw all images
            let imagesDrawn = 0;
            this.images.forEach((image, index) => {
                if (image.image) {
                    console.log(`🖼️ Drawing image ${index + 1}:`, {
                        id: image.id,
                        bounds: `${image.x},${image.y} ${image.width}x${image.height}`,
                        originalSize: `${image.image.width}x${image.image.height}`
                    });
                    
                    exportCtx.drawImage(
                        image.image,
                        image.x,
                        image.y,
                        image.width,
                        image.height
                    );
                    imagesDrawn++;
                } else {
                    console.log(`⚪ Skipping empty image slot ${index + 1}:`, image.id);
                }
            });
            
            console.log('📊 Export summary:', {
                totalSlots: this.images.length,
                imagesDrawn: imagesDrawn,
                emptySlots: this.images.length - imagesDrawn
            });
            
            // Draw rounded blue border
            this.drawRoundedBorder(exportCtx, exportCanvas.width, exportCanvas.height);
            console.log('🔵 Border applied');
            
            // Windows-specific export options
            const exportOptions = {
                type: 'image/png',
                quality: 1.0
            };
            
            if (statusMessage) {
                statusMessage.textContent = 'Converting to clipboard format...';
            }
            
            // Convert to blob and handle clipboard/download
            exportCanvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Failed to create export blob');
                }
                
                console.log('💾 Export blob created:', {
                    size: blob.size,
                    type: blob.type,
                    sizeInMB: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
                });
                
                // Try clipboard first (modern approach)
                if (this.clipboardSupport.hasClipboardWrite && this.clipboardSupport.hasClipboardItem) {
                    try {
                        console.log('📋 Attempting clipboard write...');
                        await navigator.clipboard.write([
                            new ClipboardItem({ 
                                [blob.type]: blob 
                            })
                        ]);
                        
                        if (statusMessage) {
                            statusMessage.textContent = 'Combined image copied to clipboard successfully!';
                            statusMessage.className = 'status-message success';
                        }
                        console.log('✅ Clipboard write successful');
                        
                    } catch (clipboardError) {
                        console.log('⚠️ Clipboard write failed:', clipboardError.message);
                        this.handleClipboardFallback(blob, statusMessage);
                    }
                } else {
                    console.log('⚠️ Clipboard API not supported - using fallback');
                    this.handleClipboardFallback(blob, statusMessage);
                }
                
            }, exportOptions.type, exportOptions.quality);
            
        } catch (error) {
            console.error('❌ Export error:', error);
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.textContent = `Export failed: ${error.message}`;
                statusMessage.className = 'status-message error';
            }
            
            console.log('📤 ═══════════════════════════════════════');
            console.log('📤 EXPORT COMBINED IMAGE FAILED');
            console.log('📤 ═══════════════════════════════════════');
        }
    }

    // Windows-compatible clipboard fallback
    handleClipboardFallback(blob, statusMessage) {
        console.log('🔄 Using clipboard fallback method');
        
        // Create download link as fallback
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        link.download = `prostate-report-${timestamp}.png`;
        
        // Windows compatibility: ensure link is properly handled
        link.style.display = 'none';
        document.body.appendChild(link);
        
        try {
            link.click();
            
            if (statusMessage) {
                statusMessage.textContent = 'Combined image downloaded (clipboard not supported)';
                statusMessage.className = 'status-message success';
            }
            console.log('📥 Fallback download triggered');
            
        } catch (downloadError) {
            console.error('❌ Download fallback failed:', downloadError);
            
            if (statusMessage) {
                statusMessage.textContent = 'Export failed - please try again or use a different browser';
                statusMessage.className = 'status-message error';
            }
        } finally {
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 1000);
        }
    }

    // Test function to create sample images with Windows compatibility
    createTestImages() {
        console.log('🧪 ═══════════════════════════════════════');
        console.log('🧪 CREATING TEST IMAGES');
        console.log('🧪 Windows compatibility mode:', this.isWindows);
        console.log('🧪 ═══════════════════════════════════════');
        
        try {
            // Create a test image for the left side
            const leftTestCanvas = document.createElement('canvas');
            leftTestCanvas.width = 600;
            leftTestCanvas.height = 800;
            const leftCtx = leftTestCanvas.getContext('2d');
            
            // Windows compatibility: set up proper rendering
            if (this.isWindows) {
                leftCtx.imageSmoothingEnabled = true;
                leftCtx.imageSmoothingQuality = 'high';
            }
            
            // Draw a more realistic test pattern for left image
            this.drawTestPattern(leftCtx, leftTestCanvas.width, leftTestCanvas.height, 'LEFT SCREENSHOT', '#4a90e2');
            
            // Create a test image for the right side
            const rightTestCanvas = document.createElement('canvas');
            rightTestCanvas.width = 600;
            rightTestCanvas.height = 800;
            const rightCtx = rightTestCanvas.getContext('2d');
            
            if (this.isWindows) {
                rightCtx.imageSmoothingEnabled = true;
                rightCtx.imageSmoothingQuality = 'high';
            }
            
            // Draw a more realistic test pattern for right image
            this.drawTestPattern(rightCtx, rightTestCanvas.width, rightTestCanvas.height, 'PI-RADS PAINTER', '#e24a6a');
            
            // Convert canvases to images
            this.loadTestImage(leftTestCanvas, 'left', 'Left test image');
            this.loadTestImage(rightTestCanvas, 'right', 'Right test image');
            
            console.log('🧪 ═══════════════════════════════════════');
            console.log('🧪 TEST IMAGES CREATION COMPLETED');
            console.log('🧪 ═══════════════════════════════════════');
            
        } catch (error) {
            console.error('❌ Error creating test images:', error);
        }
    }

    drawTestPattern(ctx, width, height, title, color) {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.lightenColor(color, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        
        for (let i = 0; i < height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Draw title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, width/2, height/2);
        
        // Draw dimensions
        ctx.font = '20px Arial';
        ctx.fillText(`${width} × ${height}`, width/2, height/2 + 50);
        
        // Draw timestamp
        ctx.font = '16px Arial';
        ctx.fillText(new Date().toLocaleTimeString(), width/2, height/2 + 80);
    }

    lightenColor(color, amount) {
        // Simple color lightening function
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        
        if (col.length === 3) {
            const num = parseInt(col, 16);
            const r = (num >> 8) & 255;
            const g = (num >> 4) & 255;
            const b = num & 255;
            
            return '#' + 
                Math.min(255, Math.floor(r + (255 - r) * amount)).toString(16).padStart(2, '0') +
                Math.min(255, Math.floor(g + (255 - g) * amount)).toString(16).padStart(2, '0') +
                Math.min(255, Math.floor(b + (255 - b) * amount)).toString(16).padStart(2, '0');
        }
        
        return color; // Fallback
    }

    loadTestImage(canvas, side, description) {
        console.log(`🧪 Loading test image for ${side}:`, description);
        
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('❌ Failed to create test image blob');
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Test image loaded for ${side}:`, img.width, 'x', img.height);
                this.setImage(img, side);
                this.updatePasteAreaUI(side, img);
                this.redraw();
                URL.revokeObjectURL(img.src);
            };
            
            img.onerror = () => {
                console.error(`❌ Test image failed to load for ${side}`);
                URL.revokeObjectURL(img.src);
            };
            
            img.src = URL.createObjectURL(blob);
        }, 'image/png', 1.0);
    }

    // Canvas size control
    updateCanvasSize(sizeString) {
        const [width, height] = sizeString.split('x').map(Number);
        
        // Apply minimum size constraints to prevent collapse
        // No minimum size constraint for canvas
        const minWidth = 1;
        const minHeight = 1;
        
        this.canvas.width = Math.max(minWidth, width);
        this.canvas.height = Math.max(minHeight, height);
        
        // Don't automatically resize or reposition images - let user manually adjust
        // Images maintain their current position and size
        
        this.redraw();
    }

    // Multiple image management methods
    addImage(id, x, y, width, height) {
        const image = new ResizableImage(id, x, y, width, height);
        this.images.push(image);
        return image;
    }

    removeImage(imageId) {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index > -1 && this.images.length > 1) { // Keep at least one image
            this.images.splice(index, 1);
            this.redraw();
        }
    }

    getImageById(id) {
        return this.images.find(img => img.id === id);
    }

    addScreenshotArea() {
        // Professional approach: Position new screenshots underneath existing images
        // and automatically expand canvas to accommodate them at original size
        
        const margin = 20;
        const defaultImageWidth = 600;  // Larger default size for better visibility
        const defaultImageHeight = 400;
        
        // Find the bottom-most image to position new screenshot underneath
        let bottomY = 0;
        let leftmostX = margin;
        
        if (this.images.length > 0) {
            // Find the lowest point of all existing images
            this.images.forEach(img => {
                const imageBottom = img.y + img.height;
                if (imageBottom > bottomY) {
                    bottomY = imageBottom;
                }
            });
            
            // Position new screenshot underneath with margin
            bottomY += margin;
        } else {
            bottomY = margin;
        }
        
        // Calculate position for new screenshot
        const x = leftmostX;
        const y = bottomY;
        
        // Calculate required canvas height to fit new screenshot
        const requiredHeight = y + defaultImageHeight + margin;
        
        // Auto-expand canvas in Y direction if needed
        if (requiredHeight > this.canvas.height) {
            console.log(`📐 Auto-expanding canvas height: ${this.canvas.height} → ${requiredHeight}`);
            this.canvas.height = requiredHeight;
        }
        
        // Create new screenshot image at original size
        const newId = `screenshot-${Date.now()}`;
        const newImage = this.addImage(newId, x, y, defaultImageWidth, defaultImageHeight);
        
        console.log('📷 Created new screenshot image:', {
            id: newId,
            position: `${x},${y}`,
            size: `${defaultImageWidth}x${defaultImageHeight}`,
            canvasSize: `${this.canvas.width}x${this.canvas.height}`,
            autoExpanded: requiredHeight > this.canvas.height
        });
        
        // Update UI to show new paste area
        this.updateScreenshotAreasUI();
        
        this.redraw();
        return newImage;
    }

    updateScreenshotAreasUI() {
        // Find or create container for additional paste areas
        let additionalPasteContainer = document.getElementById('additionalPasteAreas');
        if (!additionalPasteContainer) {
            additionalPasteContainer = document.createElement('div');
            additionalPasteContainer.id = 'additionalPasteAreas';
            additionalPasteContainer.className = 'additional-paste-areas';
            
            // Insert after the main paste areas
            const pasteAreas = document.querySelector('.paste-areas');
            if (pasteAreas && pasteAreas.parentNode) {
                pasteAreas.parentNode.insertBefore(additionalPasteContainer, pasteAreas.nextSibling);
            }
        }
        
        // Clear existing additional areas
        additionalPasteContainer.innerHTML = '';
        
        // Add paste areas for additional screenshot images (skip the first two default ones)
        const additionalImages = this.images.slice(2); // Skip first two (screenshot-1 and pirads)
        
        additionalImages.forEach((image, index) => {
            if (image.id.startsWith('screenshot-')) {
                const pasteAreaDiv = document.createElement('div');
                pasteAreaDiv.className = 'paste-area additional-paste-area';
                pasteAreaDiv.id = image.id + 'PasteArea';
                pasteAreaDiv.tabIndex = 0;
                
                pasteAreaDiv.innerHTML = `
                    <div class="paste-content">
                        <div class="paste-icon">📋</div>
                        <h5>Screenshot ${index + 2}</h5>
                        <p>Hier klicken und Cmd+V drücken<br>oder Bild hierher ziehen</p>
                        <button class="btn btn--danger btn--sm remove-screenshot" data-image-id="${image.id}">
                            🗑️ Entfernen
                        </button>
                        <div class="image-info" id="${image.id}ImageInfo"></div>
                    </div>
                    <canvas class="preview-canvas hidden" id="${image.id}Preview"></canvas>
                `;
                
                // Create the paste button for this additional screenshot area
                const pasteButton = document.createElement('button');
                pasteButton.className = 'btn btn--primary btn--sm paste-button';
                pasteButton.textContent = '📋 Bild aus Zwischenablage einfügen';
                pasteButton.addEventListener('click', () => pasteFromClipboard(image.id));
                
                // Add event listeners for this paste area
                pasteAreaDiv.addEventListener('paste', (e) => this.handlePaste(e, image.id));
                pasteAreaDiv.addEventListener('click', () => pasteAreaDiv.focus());
                
                // Add drag and drop support
                pasteAreaDiv.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    pasteAreaDiv.classList.add('drag-over');
                });
                
                pasteAreaDiv.addEventListener('dragleave', () => {
                    pasteAreaDiv.classList.remove('drag-over');
                });
                
                pasteAreaDiv.addEventListener('drop', (e) => {
                    e.preventDefault();
                    pasteAreaDiv.classList.remove('drag-over');
                    this.handleDrop(e, image.id);
                });
                
                // Create a wrapper container for the paste area and button
                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'additional-screenshot-wrapper';
                wrapperDiv.appendChild(pasteAreaDiv);
                wrapperDiv.appendChild(pasteButton);
                
                additionalPasteContainer.appendChild(wrapperDiv);
            }
        });
        
        // Add event listeners for remove buttons
        const removeButtons = additionalPasteContainer.querySelectorAll('.remove-screenshot');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const imageId = button.getAttribute('data-image-id');
                this.removeImage(imageId);
                this.updateScreenshotAreasUI(); // Refresh UI
            });
        });
        
        console.log('Screenshot areas updated. Total images:', this.images.length);
    }

    // Canvas resize handle methods
    getCanvasResizeHandles() {
        const size = 16;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        return [
            { name: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
            { name: 'ne', x: w - size, y: 0, cursor: 'nesw-resize' },
            { name: 'sw', x: 0, y: h - size, cursor: 'nesw-resize' },
            { name: 'se', x: w - size, y: h - size, cursor: 'nwse-resize' },
            { name: 'n', x: w/2 - size/2, y: 0, cursor: 'ns-resize' },
            { name: 's', x: w/2 - size/2, y: h - size, cursor: 'ns-resize' },
            { name: 'w', x: 0, y: h/2 - size/2, cursor: 'ew-resize' },
            { name: 'e', x: w - size, y: h/2 - size/2, cursor: 'ew-resize' }
        ];
    }

    drawCanvasResizeHandles() {
        const handles = this.getCanvasResizeHandles();
        const size = 16;
        const radius = size / 2;
        
        this.ctx.fillStyle = '#51abe4'; // theme blue
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        // Draw all handles in one batch
        this.ctx.beginPath();
        handles.forEach(h => {
            this.ctx.moveTo(h.x + radius + radius, h.y + radius);
            this.ctx.arc(h.x + radius, h.y + radius, radius, 0, 2 * Math.PI);
        });
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    getCanvasHandleAtPoint(x, y) {
        const handles = this.getCanvasResizeHandles();
        const size = 16;
        
        for (const handle of handles) {
            if (x >= handle.x && x <= handle.x + size &&
                y >= handle.y && y <= handle.y + size) {
                return handle;
            }
        }
        return null;
    }
    
    // Dynamic canvas sizing based on PI-RADS image
    updateCanvasSizeForPiRadsImage() {
        if (this.rightImage.image) {
            const piRadsHeight = this.rightImage.image.height;
            const aspectRatio = this.rightImage.image.width / this.rightImage.image.height;
            
            // Set canvas height to match PI-RADS image height
            this.canvas.height = piRadsHeight;
            
            // Adjust canvas width proportionally if needed
            const minWidth = this.defaultCanvasWidth;
            if (this.canvas.width < minWidth) {
                this.canvas.width = minWidth;
            }
            
            // Don't automatically update image areas - images keep their position and size
            
            console.log('Canvas resized to match PI-RADS image:', this.canvas.width, 'x', this.canvas.height);
            this.redraw();
        }
    }
    
    // Constrain images to canvas bounds (only called during image manipulation, not canvas resize)
    constrainImageToCanvas(image) {
        // Only apply constraints if image is being actively manipulated
        // Don't apply during canvas resize operations
        if (this.isResizingCanvas) {
            return; // Skip constraints during canvas resize
        }
        
        // Ensure image doesn't go outside canvas bounds
        if (image.x < 0) image.x = 0;
        if (image.y < 0) image.y = 0;
        if (image.x + image.width > this.canvas.width) {
            image.x = this.canvas.width - image.width;
        }
        if (image.y + image.height > this.canvas.height) {
            image.y = this.canvas.height - image.height;
        }
        
        // Ensure minimum size
        if (image.width < image.minWidth) image.width = image.minWidth;
        if (image.height < image.minHeight) image.height = image.minHeight;
        
        image.updateHandles();
    }

    // Update image areas (only called when explicitly needed, not on canvas resize)
    updateImageAreas() {
        // This method is kept for backward compatibility but doesn't auto-resize images
        // Images maintain their position and size when canvas is resized
    }
    
    // Professional pure viewport cropping - based on Photoshop/GIMP canvas resize behavior
    handleCanvasResize(deltaX, deltaY, handleName) {
        // KEY PRINCIPLE: Canvas dimensions = viewport size. Images maintain exact world coordinates.
        // NO offsets, NO content movement - ONLY viewport size changes
        
        const minWidth = 50;
        const minHeight = 50;
        const maxWidth = 3000;
        const maxHeight = 2000;
        
        // Adjust sensitivity for responsive control
        const sensitivity = 0.3; // Increased back to 0.3 for better responsiveness
        const adjustedDeltaX = deltaX * sensitivity;
        const adjustedDeltaY = deltaY * sensitivity;

        // Calculate new canvas dimensions based on handle direction
        let newWidth = this.canvasResizeStartState.width;
        let newHeight = this.canvasResizeStartState.height;

        switch (handleName) {
            case 'nw': // Top-left corner
                newWidth = this.canvasResizeStartState.width - adjustedDeltaX;
                newHeight = this.canvasResizeStartState.height - adjustedDeltaY;
                break;
            case 'ne': // Top-right corner  
                newWidth = this.canvasResizeStartState.width + adjustedDeltaX;
                newHeight = this.canvasResizeStartState.height - adjustedDeltaY;
                break;
            case 'sw': // Bottom-left corner
                newWidth = this.canvasResizeStartState.width - adjustedDeltaX;
                newHeight = this.canvasResizeStartState.height + adjustedDeltaY;
                break;
            case 'se': // Bottom-right corner
                newWidth = this.canvasResizeStartState.width + adjustedDeltaX;
                newHeight = this.canvasResizeStartState.height + adjustedDeltaY;
                break;
            case 'n': // North edge - crops from TOP (moving edge downward)
                newHeight = this.canvasResizeStartState.height - adjustedDeltaY;
                break;
            case 's': // South edge - crops from BOTTOM  
                newHeight = this.canvasResizeStartState.height + adjustedDeltaY;
                break;
            case 'w': // West edge - crops from LEFT
                newWidth = this.canvasResizeStartState.width - adjustedDeltaX;
                break;
            case 'e': // East edge - crops from RIGHT
                newWidth = this.canvasResizeStartState.width + adjustedDeltaX;
                break;
        }

        // Apply bounds
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        // Pure viewport resize - ONLY change canvas size, NEVER move content
        if (newWidth !== this.canvas.width || newHeight !== this.canvas.height) {
            console.log(`🎯 Pure viewport resize: ${this.canvas.width}x${this.canvas.height} → ${newWidth}x${newHeight} (handle: ${handleName})`);
            
            // CRITICAL: Save image states exactly as they are
            const preservedImages = this.images.map(img => ({
                id: img.id,
                x: img.x,           // Exact same world X coordinate  
                y: img.y,           // Exact same world Y coordinate
                width: img.width,   // Exact same width
                height: img.height, // Exact same height
                image: img.image,
                aspectRatio: img.aspectRatio
            }));

            // Change ONLY canvas viewport size
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;

            // Restore images to EXACT same world coordinates
            preservedImages.forEach((preserved, index) => {
                if (index < this.images.length) {
                    const img = this.images[index];
                    img.x = preserved.x;
                    img.y = preserved.y;
                    img.width = preserved.width;
                    img.height = preserved.height;
                    img.image = preserved.image;
                    img.aspectRatio = preserved.aspectRatio;
                    img.updateHandles();
                }
            });

            // Clean redraw with reset transformation matrix
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.performRedraw();
        }
    }

    drawRoundedBorder(ctx, width, height) {
        const borderRadius = 32;
        const borderWidth = 3; // Reduced from 8 to 3 for thinner border
        ctx.save();
        ctx.strokeStyle = '#51abe4'; // theme blue
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.moveTo(borderRadius, borderWidth/2);
        ctx.lineTo(width - borderRadius, borderWidth/2);
        ctx.quadraticCurveTo(width - borderWidth/2, borderWidth/2, width - borderWidth/2, borderRadius);
        ctx.lineTo(width - borderWidth/2, height - borderRadius);
        ctx.quadraticCurveTo(width - borderWidth/2, height - borderWidth/2, width - borderRadius, height - borderWidth/2);
        ctx.lineTo(borderRadius, height - borderWidth/2);
        ctx.quadraticCurveTo(borderWidth/2, height - borderWidth/2, borderWidth/2, height - borderRadius);
        ctx.lineTo(borderWidth/2, borderRadius);
        ctx.quadraticCurveTo(borderWidth/2, borderWidth/2, borderRadius, borderWidth/2);
        ctx.stroke();
        ctx.restore();
    }
}

// Global image combiner instance
// imageCombiner is initialized at the top of the file

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing all components...');
    console.log('🌍 Platform detection:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isWindows: navigator.platform.toLowerCase().includes('win'),
        language: navigator.language
    });
    
    // Windows compatibility test
    if (navigator.platform.toLowerCase().includes('win')) {
        console.log('🪟 Windows detected - running compatibility tests...');
        runWindowsCompatibilityTests();
    }
    
    // Initialize with error handling
    try {
        // Initialize befund generator
        befundGenerator = new BefundGenerator();
        window.befundGenerator = befundGenerator;
        console.log('✅ BefundGenerator initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing BefundGenerator:', error);
    }
    
    // Initialize PI-RADS Painter with delay
    setTimeout(() => {
        try {
            piradssPainter = new PIRADSPainter();
            window.piradssPainter = piradssPainter;
            console.log('✅ PI-RADS Painter initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing PI-RADS Painter:', error);
        }
    }, 100);
    
    // Initialize Image Combiner with delay
    setTimeout(() => {
        try {
            imageCombiner = new ImageCombiner();
            window.imageCombiner = imageCombiner;
            console.log('✅ Image Combiner initialized successfully');
            
            // Windows-specific initialization
            if (navigator.platform.toLowerCase().includes('win')) {
                setupWindowsSpecificFeatures();
            }
        } catch (error) {
            console.error('❌ Error initializing Image Combiner:', error);
        }
    }, 200);
    
    // Final initialization check
    setTimeout(() => {
        console.log('🎉 Application initialization complete');
        console.log('Available global objects:');
        console.log('- befundGenerator:', typeof befundGenerator !== 'undefined' ? '✅ Ready' : '❌ Failed');
        console.log('- piradssPainter:', typeof piradssPainter !== 'undefined' ? '✅ Ready' : '❌ Failed');
        console.log('- imageCombiner:', typeof imageCombiner !== 'undefined' ? '✅ Ready' : '❌ Failed');
        
        // Additional diagnostic info
        console.log('\n📋 Available Methods:');
        if (befundGenerator) {
            console.log('- befundGenerator.generateBefund()');
            console.log('- befundGenerator.addLesion()');
            console.log('- befundGenerator.resetAll()');
        }
        console.log('- setTool(toolName)');
        console.log('- addLesion()');
        console.log('- resetApplication()');
        
        console.log('\n🔧 Troubleshooting:');
        console.log('- Check browser console for any errors');
        console.log('- Ensure all files (HTML, CSS, JS) are in the same directory');
        console.log('- Image files are optional - app works without them');
        
        // Windows-specific instructions
        if (navigator.platform.toLowerCase().includes('win')) {
            console.log('\n🪟 Windows-specific tips:');
            console.log('- Use Snipping Tool (Win + Shift + S) for screenshots');
            console.log('- Try Ctrl+V after copying screenshots');
            console.log('- Drag and drop images if paste doesn\'t work');
            console.log('- Use File Select button as backup');
        }
    }, 1000);
});

// Windows compatibility tests
function runWindowsCompatibilityTests() {
    console.log('🧪 ═══════════════════════════════════════');
    console.log('🧪 WINDOWS COMPATIBILITY TESTS');
    console.log('🧪 ═══════════════════════════════════════');
    
    const tests = [
        {
            name: 'Clipboard API Support',
            test: () => !!navigator.clipboard,
            critical: false
        },
        {
            name: 'Clipboard Read Support',
            test: () => !!(navigator.clipboard && navigator.clipboard.read),
            critical: false
        },
        {
            name: 'Clipboard Write Support',
            test: () => !!(navigator.clipboard && navigator.clipboard.write),
            critical: false
        },
        {
            name: 'ClipboardItem Support',
            test: () => !!window.ClipboardItem,
            critical: false
        },
        {
            name: 'Canvas Support',
            test: () => {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext && canvas.getContext('2d'));
            },
            critical: true
        },
        {
            name: 'Canvas toBlob Support',
            test: () => {
                const canvas = document.createElement('canvas');
                return !!(canvas.toBlob);
            },
            critical: true
        },
        {
            name: 'FileReader Support',
            test: () => !!window.FileReader,
            critical: true
        },
        {
            name: 'File API Support',
            test: () => !!(window.File && window.FileList && window.Blob),
            critical: true
        },
        {
            name: 'URL.createObjectURL Support',
            test: () => !!(window.URL && window.URL.createObjectURL),
            critical: true
        },
        {
            name: 'Drag and Drop Support',
            test: () => {
                const div = document.createElement('div');
                return ('draggable' in div) && !!window.DataTransfer;
            },
            critical: false
        }
    ];
    
    let passedTests = 0;
    let criticalFailures = 0;
    
    tests.forEach((test, index) => {
        try {
            const result = test.test();
            const status = result ? '✅ PASS' : '❌ FAIL';
            const critical = test.critical ? ' (CRITICAL)' : '';
            
            console.log(`${index + 1}. ${test.name}: ${status}${critical}`);
            
            if (result) {
                passedTests++;
            } else if (test.critical) {
                criticalFailures++;
            }
        } catch (error) {
            console.log(`${index + 1}. ${test.name}: ❌ ERROR - ${error.message}`);
            if (test.critical) {
                criticalFailures++;
            }
        }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Test Results: ${passedTests}/${tests.length} passed`);
    
    if (criticalFailures > 0) {
        console.log(`❌ ${criticalFailures} critical failures detected`);
        console.log('⚠️ Some features may not work properly');
    } else {
        console.log('✅ All critical tests passed - Windows compatibility should be good');
    }
    
    console.log('🧪 ═══════════════════════════════════════');
}

// Windows-specific feature setup
function setupWindowsSpecificFeatures() {
    console.log('🪟 Setting up Windows-specific features...');
    
    // Add Windows-specific keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Windows Print Screen integration
        if (e.key === 'PrintScreen') {
            console.log('🖨️ Print Screen detected - user might be taking screenshot');
            
            // Show helpful message
            setTimeout(() => {
                const statusMessage = document.getElementById('statusMessage');
                if (statusMessage) {
                    statusMessage.textContent = 'Screenshot taken? Click on left area and press Ctrl+V to paste';
                    statusMessage.className = 'status-message info';
                    
                    setTimeout(() => {
                        statusMessage.classList.add('hidden');
                    }, 5000);
                }
            }, 1000);
        }
        
        // Windows Snipping Tool integration (Win + Shift + S)
        if (e.key === 'Meta' && e.shiftKey && e.code === 'KeyS') {
            console.log('✂️ Snipping Tool shortcut detected');
        }
    });
    
    // Add right-click context menu hints
    document.addEventListener('contextmenu', (e) => {
        const leftPasteArea = document.getElementById('leftPasteArea');
        if (leftPasteArea && leftPasteArea.contains(e.target)) {
            console.log('🖱️ Right-click on paste area - Windows user might need guidance');
            
            // Add temporary hint
            const hint = document.createElement('div');
            hint.style.cssText = `
                position: fixed;
                top: ${e.clientY + 10}px;
                left: ${e.clientX + 10}px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
            `;
            hint.textContent = 'Windows-Tipp: Verwenden Sie Ctrl+V zum Einfügen';
            document.body.appendChild(hint);
            
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.parentNode.removeChild(hint);
                }
            }, 3000);
        }
    });
    
    // Windows notification permission request (if supported)
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('🔔 Notification permission:', permission);
            });
        }
    }
    
    console.log('✅ Windows-specific features configured');
}

// Add global Windows compatibility debugging function
window.debugWindowsCompatibility = function() {
    console.log('🔍 ═══════════════════════════════════════');
    console.log('🔍 WINDOWS COMPATIBILITY DEBUG INFO');
    console.log('🔍 ═══════════════════════════════════════');
    
    if (imageCombiner) {
        console.log('📋 Paste Statistics:', {
            attempts: imageCombiner.pasteAttempts || 0,
            successful: imageCombiner.successfulPastes || 0,
            failed: imageCombiner.failedPastes || 0
        });
        
        console.log('🖼️ Image Status:', {
            totalSlots: imageCombiner.images.length,
            imagesLoaded: imageCombiner.images.filter(i => i.image).length,
            leftImage: !!imageCombiner.leftImage?.image,
            rightImage: !!imageCombiner.rightImage?.image
        });
        
        console.log('🔧 Clipboard Support:', imageCombiner.clipboardSupport);
    }
    
    // Check PI-RADS painter status
    if (piradssPainter) {
        console.log('🎨 PI-RADS Painter Status:', {
            canvasExists: !!piradssPainter.canvas,
            canvasSize: piradssPainter.canvas ? `${piradssPainter.canvas.width}x${piradssPainter.canvas.height}` : 'N/A',
            pathsCount: piradssPainter.paths ? piradssPainter.paths.length : 0,
            lesionsCount: piradssPainter.lesions ? piradssPainter.lesions.length : 0
        });
        
        // Test if canvas is tainted
        if (piradssPainter.canvas) {
            try {
                piradssPainter.canvas.toDataURL();
                console.log('🎨 Canvas Status: ✅ Clean (not tainted)');
            } catch (error) {
                console.log('🎨 Canvas Status: ⚠️ Tainted (contains cross-origin content)');
                console.log('💡 This is expected when loading local image files and is handled by fallback methods');
            }
        }
    }
    
    runWindowsCompatibilityTests();
    
    console.log('🔍 ═══════════════════════════════════════');
};

// Add function to manually trigger painter image update
window.updatePainterImageManually = function() {
    if (imageCombiner) {
        console.log('🔄 Manually triggering painter image update...');
        imageCombiner.updatePainterImage();
    } else {
        console.log('❌ Image combiner not available');
    }
};

// Add helpful message for Windows users
if (navigator.platform.toLowerCase().includes('win')) {
    console.log(`
🪟 Windows User Detected!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 How to use the image combiner on Windows:
1. Take a screenshot using Snipping Tool (Win + Shift + S)
2. Click on the left paste area
3. Press Ctrl + V to paste
4. If paste doesn't work, try drag & drop or "File Select"
5. The PI-RADS image updates automatically

🔧 Troubleshooting:
- Run debugWindowsCompatibility() in console for diagnostics
- Check that you have copied an image, not text
- Try refreshing the page if clipboard access is denied
- Use the "Test Images" button to verify functionality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
};