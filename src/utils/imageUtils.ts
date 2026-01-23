
export const urlToBase64 = async (url: string, useProxy = false): Promise<string> => {
    try {
        const fetchUrl = useProxy
            ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            : url;

        const response = await fetch(fetchUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        if (!useProxy) {
            console.warn("Direct image fetch failed, retrying with proxy:", error);
            return urlToBase64(url, true);
        }

        console.warn("Proxy image fetch failed too, trying canvas fallback:", error);
        // Fallback to Canvas method
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error('Canvas image load failed'));
        });
    }
};
