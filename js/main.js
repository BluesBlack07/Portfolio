// ====== EDIT YOUR CONTACT DETAILS HERE ======
const CONTACT = {
    whatsapp: '910000000000',        // country code + number, no "+" or spaces
    email: 'hello@example.com',
    // Paste your Calendly link to show your live Calendly calendar, e.g.
    // 'https://calendly.com/gargi-nitya/15min'. Leave empty to use the built-in booking form.
    calendly: ''
};

// Booking slots for the built-in form (shown in IST)
const BOOKING = {
    slots: ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'],
    closedDays: [0]                  // 0 = Sunday, 6 = Saturday
};

// Switch the hero lamps on 10 ms after the page loads
setTimeout(() => document.getElementById('home').classList.add('lit'), 10);

const navbar = document.getElementById('navbar');
const toggle = document.getElementById('nav-toggle');
const links = document.querySelectorAll('.nav-links a:not(.btn)');

// Sticky navbar background on scroll
const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll);
onScroll();

// Mobile menu
toggle.addEventListener('click', () => {
    const open = navbar.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
    navbar.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
}));

// Highlight the nav link for the section in view
const sections = [...document.querySelectorAll('header[id], section[id]')];
const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

// Reveal-on-scroll animation
const revealEls = document.querySelectorAll('.card, .work-card, .step, .about-img, .about-text, details, .contact > *, .booking > *');
const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
revealEls.forEach(el => { el.classList.add('reveal'); revealer.observe(el); });

// Pricing buttons pre-select the package in the contact form
const planSelect = document.getElementById('f-plan');
document.querySelectorAll('[data-plan]').forEach(btn =>
    btn.addEventListener('click', () => { planSelect.value = btn.dataset.plan; })
);

// Apply contact details
const waUrl = 'https://wa.me/' + CONTACT.whatsapp;
document.getElementById('wa-link').href = waUrl;
document.getElementById('wa-float').href = waUrl;
document.getElementById('email-link').href = 'mailto:' + CONTACT.email;

// Contact form -> opens WhatsApp with the message pre-filled
document.getElementById('contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const plan = planSelect.value || 'Not sure yet';
    const msg = document.getElementById('f-msg').value.trim();
    const text = `Hi Gargi! I'm ${name}.${phone ? ' Phone: ' + phone + '.' : ''}\nPackage: ${plan}\n\n${msg}`;
    window.open(waUrl + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
});

// ====== Appointment booking ======
const bookingBox = document.getElementById('booking-box');

if (CONTACT.calendly) {
    // Calendly mode: embed the live calendar in the site's colours
    const url = new URL(CONTACT.calendly);
    url.searchParams.set('hide_gdpr_banner', '1');
    url.searchParams.set('primary_color', 'e3a33b');
    bookingBox.innerHTML = `<div class="calendly-inline-widget" data-url="${url}"></div>`;
    const s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.async = true;
    document.body.appendChild(s);
} else {
    // Built-in mode: pick date + slot, request is sent on WhatsApp
    const dateInput = document.getElementById('b-date');
    const slotsEl = document.getElementById('b-slots');
    const errorEl = document.getElementById('b-error');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let chosenSlot = '';

    const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const slotMinutes = s => {
        const [, h, m, ap] = s.match(/(\d+):(\d+) (AM|PM)/);
        return ((+h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + +m;
    };
    const today = new Date();
    dateInput.min = toISO(today);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
    dateInput.max = toISO(maxDate);

    const renderSlots = () => {
        const isToday = dateInput.value === toISO(new Date());
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        slotsEl.innerHTML = '';
        BOOKING.slots.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'slot';
            b.textContent = s;
            b.setAttribute('role', 'radio');
            b.disabled = isToday && slotMinutes(s) <= nowMin + 60;   // need at least 1 hour notice
            if (b.disabled && chosenSlot === s) chosenSlot = '';
            b.setAttribute('aria-checked', chosenSlot === s);
            b.addEventListener('click', () => {
                chosenSlot = s;
                errorEl.textContent = '';
                slotsEl.querySelectorAll('.slot').forEach(x => x.setAttribute('aria-checked', x === b));
            });
            slotsEl.appendChild(b);
        });
    };

    dateInput.addEventListener('change', () => {
        errorEl.textContent = '';
        const d = new Date(dateInput.value + 'T00:00');
        if (dateInput.value && BOOKING.closedDays.includes(d.getDay())) {
            errorEl.textContent = `Sorry, I'm not available on ${dayNames[d.getDay()]}s. Please pick another day.`;
            dateInput.value = '';
        }
        renderSlots();
    });
    renderSlots();

    document.getElementById('booking-form').addEventListener('submit', e => {
        e.preventDefault();
        if (!chosenSlot) { errorEl.textContent = 'Please choose a time slot.'; return; }
        const d = new Date(dateInput.value + 'T00:00');
        const niceDate = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const text = `Hi Gargi! I'd like to book a free consultation call.\n\n` +
            `Name: ${document.getElementById('b-name').value.trim()}\n` +
            `Phone: ${document.getElementById('b-phone').value.trim()}\n` +
            `Date: ${niceDate}\nTime: ${chosenSlot} (IST)\n` +
            `Call type: ${document.getElementById('b-mode').value}`;
        window.open(waUrl + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
}

document.getElementById('year').textContent = new Date().getFullYear();
