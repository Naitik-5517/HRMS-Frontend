// export const fileToBase64 = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       const base64 = reader.result.split(",")[1]; // remove data:mime;base64,
//       resolve(base64);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });


export const fileToBase64 = (input) => {
  // Accepts File, Blob, or array of File/Blob
  if (Array.isArray(input)) {
    // Filter only File/Blob objects
    const files = input.filter(f => f instanceof File || f instanceof Blob);
    return Promise.all(files.map(file => fileToBase64(file)));
  }
  if (!(input instanceof File || input instanceof Blob)) {
    return Promise.reject(new Error('Input is not a File or Blob'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(input);
    reader.onload = () => {
      // Always return the full data URL (with prefix)
      resolve(reader.result);
    };
    reader.onerror = error => reject(error);
  });
};
