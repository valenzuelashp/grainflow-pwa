import * as htmlToImage from 'html-to-image';

export const generateCSV = (headers: string[], data: any[][], fileName: string = 'Report') => {
    if (!data || data.length === 0) return;

    // Combine headers and data into one array of arrays
    const combinedData = [headers, ...data];

    // Map through rows and handle potential commas in values (rice names, etc.)
    const csvContent = combinedData
        .map(row => 
            row.map(value => {
                const strValue = value?.toString() || "";
                // If value contains a comma, wrap it in quotes for CSV safety
                return strValue.includes(",") ? `"${strValue}"` : strValue;
            }).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.click();
    URL.revokeObjectURL(url);
};

export const exportAsImage = async (
    ref: React.RefObject<HTMLDivElement | null>,
    fileName: string,
    bgColor: string = '#ffffff'
) => {
    if (!ref || !ref.current) return;

    try {
        const dataUrl = await htmlToImage.toPng(ref.current, {
            backgroundColor: bgColor,
            pixelRatio: 2, 
            quality: 0.9,
            cacheBust: true,
            skipFonts: true,
        });

        if (!dataUrl || dataUrl.length < 1000) throw new Error("Empty image generated");

        const imgLink = document.createElement('a');
        imgLink.download = `${fileName}.png`;
        imgLink.href = dataUrl;
        imgLink.click();
    } catch (error) {
        console.error("Capture Error:", error);
        alert("Report is too large for an image. Please use CSV Export for full history.");
    }
};