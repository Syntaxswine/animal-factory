process.env.PORT ||= '4327';
console.log(`Red Shift: http://127.0.0.1:${process.env.PORT}/tactics/index.html`);
await import('./serve.mjs');
