// Chart configuration defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
Chart.defaults.font.family = 'Inter';

// --- Mobile Menu ---
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuBtn.querySelector('i').classList.toggle('fa-bars');
    menuBtn.querySelector('i').classList.toggle('fa-times');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuBtn.querySelector('i').classList.add('fa-bars');
        menuBtn.querySelector('i').classList.remove('fa-times');
    });
});

// --- Utility Functions ---
const generateSine = (freq, amp, length, phase = 0) => {
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(amp * Math.sin(2 * Math.PI * freq * (i / length) + phase));
    }
    return data;
};

const generateSquare = (freq, amp, length) => {
    const data = [];
    const period = length / freq;
    for (let i = 0; i < length; i++) {
        data.push(Math.sin(2 * Math.PI * freq * (i / length)) >= 0 ? amp : -amp);
    }
    return data;
};

// --- Module 1: Signal Visualizer ---
const signalCtx = document.getElementById('signalChart').getContext('2d');
let currentSignalType = 'analog';

const signalChart = new Chart(signalCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 100}, (_, i) => i),
        datasets: [{
            label: 'Analog Signal',
            data: generateSine(2, 1, 100),
            borderColor: '#6366f1',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { min: -1.5, max: 1.5 },
            x: { display: false }
        }
    }
});

document.getElementById('btn-analog').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-digital').classList.remove('active');
    signalChart.data.datasets[0].data = generateSine(2, 1, 100);
    signalChart.data.datasets[0].label = 'Analog Signal';
    signalChart.data.datasets[0].stepped = false;
    signalChart.update();
});

document.getElementById('btn-digital').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-analog').classList.remove('active');
    signalChart.data.datasets[0].data = generateSquare(2, 1, 100);
    signalChart.data.datasets[0].label = 'Digital Signal';
    signalChart.data.datasets[0].stepped = true;
    signalChart.update();
});

// --- Module 2: Sampling Theorem ---
const samplingCtx = document.getElementById('samplingChart').getContext('2d');
const samplingFreqSlider = document.getElementById('sampling-freq');
const fsValDisplay = document.getElementById('fs-val');
const samplingInfo = document.getElementById('sampling-info');

const fm = 10; // Message frequency in Hz
const samplingChart = new Chart(samplingCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 200}, (_, i) => (i / 100).toFixed(2)),
        datasets: [
            {
                label: 'Continuous Signal',
                data: generateSine(fm, 1, 200),
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                pointRadius: 0,
                fill: false
            },
            {
                label: 'Sampled Points',
                data: [],
                borderColor: '#a855f7',
                backgroundColor: '#a855f7',
                borderWidth: 0,
                pointRadius: 4,
                showLine: false
            },
            {
                label: 'Reconstructed',
                data: [],
                borderColor: '#38bdf8',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: -1.2, max: 1.2 } }
    }
});

function updateSampling() {
    const fs = parseInt(samplingFreqSlider.value);
    fsValDisplay.innerText = fs;
    
    // Update sampling points
    const sampledData = [];
    const reconstructedData = [];
    const step = 200 / fs;
    
    for (let i = 0; i < 200; i++) {
        if (i % Math.round(step) === 0) {
            const val = Math.sin(2 * Math.PI * fm * (i / 200));
            sampledData.push({x: (i/100).toFixed(2), y: val});
        }
    }
    
    samplingChart.data.datasets[1].data = sampledData;
    
    // Simple Sinc-like or Linear reconstruction
    if (fs >= 2 * fm) {
        samplingChart.data.datasets[2].data = generateSine(fm, 1, 200).map((v, i) => ({x: (i/100).toFixed(2), y: v}));
    } else {
        // Aliased frequency: abs(fs - fm) or similar
        const aliasedF = Math.abs(fs - fm);
        samplingChart.data.datasets[2].data = generateSine(aliasedF, 1, 200).map((v, i) => ({x: (i/100).toFixed(2), y: v}));
    }
    
    if (fs < 2 * fm) {
        samplingInfo.classList.add('warning');
        samplingInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Aliasing Occurring! $f_s < 2f_m$</span>`;
        samplingInfo.style.background = 'rgba(239, 68, 68, 0.1)';
        samplingInfo.style.borderColor = '#ef4444';
    } else {
        samplingInfo.classList.remove('warning');
        samplingInfo.innerHTML = `<i class="fas fa-check-circle"></i> <span>Proper Sampling: $f_s \\geq 2f_m$</span>`;
        samplingInfo.style.background = 'rgba(34, 197, 94, 0.1)';
        samplingInfo.style.borderColor = '#22c55e';
    }
    
    samplingChart.update();
}

samplingFreqSlider.addEventListener('input', updateSampling);
updateSampling();

// --- Module 3: Modulation ---
const msgCtx = document.getElementById('msgChart').getContext('2d');
const carrierCtx = document.getElementById('carrierChart').getContext('2d');
const modCtx = document.getElementById('modulatedChart').getContext('2d');
const modFreqSlider = document.getElementById('mod-freq');
const fcValDisplay = document.getElementById('fc-val');

let activeMod = 'am';

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { min: -2, max: 2 } }
};

const msgChart = new Chart(msgCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 200}, (_, i) => i),
        datasets: [{ data: generateSine(1, 1, 200), borderColor: '#6366f1', pointRadius: 0 }]
    },
    options: chartOptions
});

const carrierChart = new Chart(carrierCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 200}, (_, i) => i),
        datasets: [{ data: [], borderColor: '#a855f7', pointRadius: 0 }]
    },
    options: chartOptions
});

const modulatedChart = new Chart(modCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 200}, (_, i) => i),
        datasets: [{ data: [], borderColor: '#38bdf8', pointRadius: 0 }]
    },
    options: chartOptions
});

function updateModulation() {
    const fc = parseInt(modFreqSlider.value);
    fcValDisplay.innerText = fc;
    
    const message = generateSine(1, 1, 200);
    const carrier = generateSine(fc, 1, 200);
    let modulated = [];
    
    if (activeMod === 'am') {
        modulated = message.map((m, i) => (1 + 0.5 * m) * Math.sin(2 * Math.PI * fc * (i / 200)));
    } else if (activeMod === 'fm') {
        let phase = 0;
        for (let i = 0; i < 200; i++) {
            phase += 2 * Math.PI * (fc + 5 * message[i]) / 200;
            modulated.push(Math.sin(phase));
        }
    } else if (activeMod === 'ask') {
        const digitalMsg = message.map(m => m >= 0 ? 1 : 0);
        modulated = carrier.map((c, i) => digitalMsg[i] * c);
    }
    
    carrierChart.data.datasets[0].data = carrier;
    modulatedChart.data.datasets[0].data = modulated;
    
    carrierChart.update();
    modulatedChart.update();
}

document.querySelectorAll('.btn-mod').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-mod').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeMod = this.dataset.mod;
        updateModulation();
    });
});

modFreqSlider.addEventListener('input', updateModulation);
updateModulation();

// --- Module 4: Noise ---
const noiseCtx = document.getElementById('noiseChart').getContext('2d');
const noiseLevelSlider = document.getElementById('noise-level');
const noiseValDisplay = document.getElementById('noise-val');

const noiseChart = new Chart(noiseCtx, {
    type: 'line',
    data: {
        labels: Array.from({length: 100}, (_, i) => i),
        datasets: [
            { label: 'Noisy Signal', data: [], borderColor: '#ef4444', pointRadius: 0 },
            { label: 'Clean Signal', data: generateSine(2, 1, 100), borderColor: '#6366f1', pointRadius: 0, borderWidth: 1 }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: -2, max: 2 } }
    }
});

function updateNoise() {
    const level = parseFloat(noiseLevelSlider.value);
    noiseValDisplay.innerText = level;
    
    const clean = generateSine(2, 1, 100);
    const noisy = clean.map(v => v + (Math.random() - 0.5) * level * 4);
    
    noiseChart.data.datasets[0].data = noisy;
    noiseChart.update();
}

noiseLevelSlider.addEventListener('input', updateNoise);
updateNoise();

// --- Module 5: Line Coding ---
const lineCodingCtx = document.getElementById('lineCodingChart').getContext('2d');
const binaryInput = document.getElementById('binary-input');
let activeCoding = 'nrz';

const lineCodingChart = new Chart(lineCodingCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            data: [],
            borderColor: '#38bdf8',
            borderWidth: 3,
            stepped: true,
            fill: false,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: -1.5, max: 1.5 },
            x: { grid: { display: true } }
        }
    }
});

function updateLineCoding() {
    const bits = binaryInput.value.replace(/[^01]/g, '').split('');
    let data = [];
    let labels = [];
    
    if (activeCoding === 'nrz') {
        bits.forEach((bit, i) => {
            data.push(bit === '1' ? 1 : -1);
            labels.push(i);
        });
        lineCodingChart.data.datasets[0].stepped = 'after';
    } else if (activeCoding === 'rz') {
        bits.forEach((bit, i) => {
            if (bit === '1') {
                data.push(1);
                data.push(0);
            } else {
                data.push(-1);
                data.push(0);
            }
            labels.push(i);
            labels.push(i + 0.5);
        });
        lineCodingChart.data.datasets[0].stepped = 'after';
    }
    
    // Add an extra point at the end to finish the line
    if (labels.length > 0) {
        labels.push(bits.length);
        data.push(data[data.length - 1]);
    }
    
    lineCodingChart.data.labels = labels;
    lineCodingChart.data.datasets[0].data = data;
    lineCodingChart.update();
}

binaryInput.addEventListener('input', updateLineCoding);
document.querySelectorAll('[data-code]').forEach(el => {
    el.addEventListener('click', function() {
        document.querySelectorAll('[data-code]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeCoding = this.dataset.code;
        updateLineCoding();
    });
});

updateLineCoding();

// --- Scroll Reveal ---
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});
