# **App Name**: Agni-Drishti

## Core Features:

- Live Hotspot Dashboard: Visualizes active forest fire data from NASA FIRMS on a dark-themed interactive map with real-time updates from Firestore.
- Generative Risk Forecaster: Uses AI as a tool to process local weather data and hotspot clusters to predict fire spread risk and suggest action plans.
- Voice-Activated Citizen Report: Multilingual reporting using Web Speech API to capture descriptions of fire incidents hands-free in remote conditions.
- AI Content Classification: Utilizes a classification tool to automatically verify if a citizen report is fire-related based on description and photos.
- Regional Alert Feed: Real-time scrolling feed of fire alerts from satellite sources and vetted citizen reports synchronized via Firestore.
- Automated Help-Centre Routing: Cross-references user GPS location against a geo-indexed help-centre collection to find the nearest Range Office contact.
- WhatsApp Intel Sharer: Generates a copyable multilingual emergency digest based on AI analysis to be shared immediately with local communities.

## Style Guidelines:

- Primary color: Ember Orange (#FF5C1A) chosen for high visibility and resonance with fire monitoring.
- Background color: Deep Forest Black (#0a0f0a), heavily desaturated and darkened to allow fire data markers to stand out.
- Accent color: Heat Red (#D63031), analogous to the primary and shifted 30 degrees to indicate emergency status.
- Headline font: 'Exo 2' (sans-serif) for a high-tech command center feel; Body font: 'Noto Sans' (sans-serif) to support multilingual Devanagari script. Note: currently only Google Fonts are supported.
- The command dashboard utilizes a 3-column 'Liquid Glass' grid layout with high transparency (bg-rgba(255,255,255,0.04)) and backdrop blurs.
- Ember-glowing satellite icons and custom yellow smoke icons distinguish citizen reports from satellite thermal hotspots.
- Emergency alerts include expanding concentric ring pulses and CSS flame flickers on hover interactions for citizen forms.