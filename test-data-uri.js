(async () => {
  const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAGBAQABAAAAAAAAAAAAAAAAAAABAP/jABQEAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8A0s8f/9k=';
  try {
    const res = await fetch(dataUri);
    console.log("Fetch success:", res.ok);
    const buf = await res.arrayBuffer();
    console.log("Buffer length:", buf.byteLength);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
})();
