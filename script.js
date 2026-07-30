const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const displayEl = document.querySelector('.display');
const historyList = document.getElementById('historyList');
const scientificBtns = document.getElementById('scientificBtns');
const matrixPanel = document.getElementById('matrixPanel');
const basicBtns = document.getElementById('basicBtns');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const calculatorEl = document.getElementById('calculator');

let currentExpression = '';
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

// ═══════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════
function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-msg">No calculations yet</p>';
        return;
    }
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="hist-body">
                <div class="hist-expr">${escapeHtml(item.expression)}</div>
                <div class="hist-result">= ${escapeHtml(item.result)}</div>
            </div>
            <button class="hist-menu" onclick="deleteHistoryItem(${index}, event)" title="Delete">&#8942;</button>`;
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('hist-delete')) return;
            currentExpression = item.result;
            updateDisplay();
        });
        historyList.appendChild(div);
    });
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function saveHistory(expression, result) {
    history.unshift({ expression, result });
    if (history.length > 50) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
}

function deleteHistoryItem(index, event) {
    event.stopPropagation();
    history.splice(index, 1);
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
}

function clearHistory() {
    history = [];
    localStorage.removeItem('calcHistory');
    renderHistory();
}

// ═══════════════════════════════════════
//  SIDEBAR & MODE
// ═══════════════════════════════════════
function toggleSidebar() {
    sidebar.classList.toggle('hidden');
    sidebarToggle.classList.toggle('shifted');
    calculatorEl.classList.toggle('with-sidebar');
}

function setMode(mode) {
    document.getElementById('btnBasic').classList.toggle('active', mode === 'basic');
    document.getElementById('btnScientific').classList.toggle('active', mode === 'scientific');
    document.getElementById('btnMatrix').classList.toggle('active', mode === 'matrix');
    scientificBtns.classList.toggle('hidden', mode !== 'scientific');
    matrixPanel.classList.toggle('hidden', mode !== 'matrix');
    basicBtns.classList.toggle('hidden', mode === 'matrix');
}

// ═══════════════════════════════════════
//  DISPLAY
// ═══════════════════════════════════════
function updateDisplay() {
    expressionEl.value = formatExpression(currentExpression);
    expressionEl.scrollLeft = expressionEl.scrollWidth;
}

function formatExpression(expr) {
    return expr
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/\+/g, ' + ')
        .replace(/(^|[^e])-/g, '$1 − ');
}

function insertText(text) {
    currentExpression += text;
    updateDisplay();
}

function insertFunc(func) {
    currentExpression += func;
    updateDisplay();
}

function insertConst(c) {
    if (c === 'pi') currentExpression += String(Math.PI);
    else if (c === 'e') currentExpression += String(Math.E);
    updateDisplay();
}

function clearDisplay() {
    currentExpression = '';
    expressionEl.value = '';
    resultEl.value = '0';
    displayEl.classList.remove('error');
}

function deleteLast() {
    const funcPatterns = ['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'sqrt(', 'cbrt(', 'abs(', 'exp(', '10^(', '2^('];
    for (const fn of funcPatterns) {
        if (currentExpression.endsWith(fn)) {
            currentExpression = currentExpression.slice(0, -fn.length);
            updateDisplay();
            return;
        }
    }
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
}

// ═══════════════════════════════════════
//  SCIENTIFIC MATH
// ═══════════════════════════════════════
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    if (!Number.isInteger(n)) return gammaApprox(n + 1);
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function gammaApprox(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaApprox(1 - z));
    z -= 1;
    const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function preprocessExpression(expr) {
    let s = expr;
    s = s.replace(/pi/g, `(${Math.PI})`);
    s = s.replace(/(?<![a-z])e(?![a-z(])/g, `(${Math.E})`);
    s = s.replace(/(\d+\.?\d*)!/g, 'factorial($1)');
    s = s.replace(/\)!/g, ')_FACT');
    s = s.replace(/\)_FACT/g, ')');
    s = s.replace(/\^/g, '**');
    s = s.replace(/\bmod\b/g, '%');
    s = s.replace(/10\*\*\(/g, 'Math.pow(10,');
    s = s.replace(/2\*\*\(/g, 'Math.pow(2,');
    s = s.replace(/\basin\(/g, 'Math.asin(');
    s = s.replace(/\bacos\(/g, 'Math.acos(');
    s = s.replace(/\batan\(/g, 'Math.atan(');
    s = s.replace(/\bsin\(/g, 'Math.sin(Math.PI/180*');
    s = s.replace(/\bcos\(/g, 'Math.cos(Math.PI/180*');
    s = s.replace(/\btan\(/g, 'Math.tan(Math.PI/180*');
    s = s.replace(/\blog\(/g, 'Math.log10(');
    s = s.replace(/\bln\(/g, 'Math.log(');
    s = s.replace(/\bsqrt\(/g, 'Math.sqrt(');
    s = s.replace(/\bcbrt\(/g, 'Math.cbrt(');
    s = s.replace(/\babs\(/g, 'Math.abs(');
    s = s.replace(/\bexp\(/g, 'Math.exp(');
    s = s.replace(/(\d)\(/g, '$1*(');
    s = s.replace(/\)\(/g, ')*(');
    const open = (s.match(/\(/g) || []).length;
    const close = (s.match(/\)/g) || []).length;
    for (let i = close; i < open; i++) s += ')';
    return s;
}

function calculate() {
    if (!currentExpression.trim()) return;
    try {
        const processed = preprocessExpression(currentExpression);
        const fn = new Function('factorial', '"use strict"; return (' + processed + ');');
        const result = fn(factorial);
        if (result === undefined || result === null) throw new Error('Invalid');
        let resultStr;
        if (typeof result === 'number') {
            resultStr = Number.isInteger(result) && Math.abs(result) < 1e15
                ? result.toString()
                : parseFloat(result.toPrecision(12)).toString();
        } else {
            resultStr = String(result);
        }
        if (resultStr === 'NaN') throw new Error('Invalid');
        resultEl.value = resultStr;
        saveHistory(currentExpression, resultStr);
        currentExpression = resultStr;
        displayEl.classList.remove('error');
    } catch (e) {
        resultEl.value = 'Error';
        displayEl.classList.add('error');
        setTimeout(() => displayEl.classList.remove('error'), 400);
    }
}

// ═══════════════════════════════════════
//  MATRIX ENGINE
// ═══════════════════════════════════════
function getMatrixSize() {
    return {
        rows: parseInt(document.getElementById('matRows').value),
        cols: parseInt(document.getElementById('matCols').value)
    };
}

function resizeMatrix() {
    const { rows, cols } = getMatrixSize();
    buildMatrixGrid('matrixA', rows, cols);
    buildMatrixGrid('matrixB', rows, cols);
    document.getElementById('matrixResult').textContent = '';
    updateMatrixBWarpVisibility();
}

function buildMatrixGrid(id, rows, cols) {
    const grid = document.getElementById(id);
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.id = id + '_' + i + '_' + j;
            inp.value = (i === j) ? '1' : '0';
            inp.placeholder = '0';
            grid.appendChild(inp);
        }
    }
}

function readMatrix(id, rows, cols) {
    const mat = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const val = parseFloat(document.getElementById(id + '_' + i + '_' + j).value);
            if (isNaN(val)) throw new Error('Invalid matrix value');
            row.push(val);
        }
        mat.push(row);
    }
    return mat;
}

function writeMatrix(id, mat) {
    const grid = document.getElementById(id);
    grid.innerHTML = '';
    const rows = mat.length, cols = mat[0].length;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.id = id + '_' + i + '_' + j;
            const v = mat[i][j];
            inp.value = Math.abs(v) < 1e-10 ? '0' : parseFloat(v.toPrecision(8)).toString();
            grid.appendChild(inp);
        }
    }
}

function formatMatrix(mat) {
    return mat.map(row => row.map(v => {
        const val = Math.abs(v) < 1e-10 ? 0 : parseFloat(v.toPrecision(8));
        return String(val).padStart(10);
    }).join('  ')).join('\n');
}

function matAdd(a, b) {
    return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

function matSub(a, b) {
    return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

function matMul(a, b) {
    const res = [];
    for (let i = 0; i < a.length; i++) {
        const row = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) sum += a[i][k] * b[k][j];
            row.push(sum);
        }
        res.push(row);
    }
    return res;
}

function matScalar(a, k) {
    return a.map(row => row.map(v => v * k));
}

function matTranspose(a) {
    const rows = a.length, cols = a[0].length;
    const res = [];
    for (let j = 0; j < cols; j++) {
        const row = [];
        for (let i = 0; i < rows; i++) row.push(a[i][j]);
        res.push(row);
    }
    return res;
}

function matDet(a) {
    const n = a.length;
    if (n === 1) return a[0][0];
    if (n === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    let det = 0;
    for (let j = 0; j < n; j++) {
        const minor = a.slice(1).map(r => [...r.slice(0, j), ...r.slice(j + 1)]);
        det += Math.pow(-1, j) * a[0][j] * matDet(minor);
    }
    return det;
}

function matInv(a) {
    const n = a.length;
    const det = matDet(a);
    if (Math.abs(det) < 1e-12) throw new Error('Matrix is singular (det ≈ 0)');
    if (n === 1) return [[1 / det]];
    if (n === 2) {
        return [
            [ a[1][1] / det, -a[0][1] / det],
            [-a[1][0] / det,  a[0][0] / det]
        ];
    }
    const adj = [];
    for (let i = 0; i < n; i++) {
        adj[i] = [];
        for (let j = 0; j < n; j++) {
            const minor = a.filter((_, ri) => ri !== i).map(r => r.filter((_, ci) => ci !== j));
            adj[i][j] = Math.pow(-1, i + j) * matDet(minor);
        }
    }
    const adjT = matTranspose(adj);
    return adjT.map(row => row.map(v => v / det));
}

function matTrace(a) {
    let t = 0;
    for (let i = 0; i < a.length; i++) t += a[i][i];
    return t;
}

function updateMatrixBWarpVisibility() {
    const op = document.querySelector('.mat-op-btn.active-op');
}

function matrixOp(op) {
    const { rows, cols } = getMatrixSize();
    const resultEl_ = document.getElementById('matrixResult');

    try {
        const A = readMatrix('matrixA', rows, cols);
        let result, scalarNeeded = false, scalarResult = false;

        switch (op) {
            case 'add': {
                const B = readMatrix('matrixB', rows, cols);
                result = matAdd(A, B);
                break;
            }
            case 'sub': {
                const B = readMatrix('matrixB', rows, cols);
                result = matSub(A, B);
                break;
            }
            case 'mul': {
                const { cols: colsB } = getMatrixSize();
                const B = readMatrix('matrixB', rows, cols);
                if (A[0].length !== B.length) throw new Error('A cols must equal B rows');
                result = matMul(A, B);
                break;
            }
            case 'scalar': {
                const k = parseFloat(document.getElementById('scalarValue').value);
                if (isNaN(k)) throw new Error('Invalid scalar');
                result = matScalar(A, k);
                break;
            }
            case 'transpose': {
                result = matTranspose(A);
                break;
            }
            case 'det': {
                if (rows !== cols) throw new Error('Matrix must be square');
                const d = matDet(A);
                resultEl_.textContent = 'det(A) = ' + (Math.abs(d) < 1e-10 ? '0' : parseFloat(d.toPrecision(10)));
                saveHistory('det(' + rows + 'x' + cols + ' matrix)', resultEl_.textContent);
                return;
            }
            case 'inv': {
                if (rows !== cols) throw new Error('Matrix must be square');
                result = matInv(A);
                break;
            }
            case 'trace': {
                if (rows !== cols) throw new Error('Matrix must be square');
                const t = matTrace(A);
                resultEl_.textContent = 'tr(A) = ' + (Math.abs(t) < 1e-10 ? '0' : parseFloat(t.toPrecision(10)));
                saveHistory('tr(' + rows + 'x' + cols + ' matrix)', resultEl_.textContent);
                return;
            }
        }

        if (result) {
            resultEl_.textContent = formatMatrix(result);
            const opNames = { add: 'A+B', sub: 'A−B', mul: 'A×B', scalar: 'k×A', transpose: 'Aᵀ', inv: 'A⁻¹' };
            saveHistory(opNames[op] + ' (' + rows + 'x' + cols + ')', formatMatrix(result).replace(/\n/g, ', '));
        }
    } catch (e) {
        resultEl_.textContent = 'Error: ' + e.message;
    }
}

// ═══════════════════════════════════════
//  KEYBOARD
// ═══════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') insertText(e.key);
    else if (e.key === '.') insertText('.');
    else if (e.key === '+') insertText('+');
    else if (e.key === '-') insertText('-');
    else if (e.key === '*') insertText('*');
    else if (e.key === '/') { e.preventDefault(); insertText('/'); }
    else if (e.key === '(') insertText('(');
    else if (e.key === ')') insertText(')');
    else if (e.key === '^') insertText('^(');
    else if (e.key === '%') insertText('%');
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate(); }
    else if (e.key === 'Backspace') deleteLast();
    else if (e.key === 'Escape') clearDisplay();
});

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
renderHistory();
resultEl.value = '0';
resizeMatrix();
