let fileInput: HTMLInputElement | null = document.querySelector("input[type=file]");
let widthInput: HTMLInputElement | null = document.querySelector("input[id=width]");
let heightInput: HTMLInputElement | null = document.querySelector("input[id=height]");
let filterInput: HTMLSelectElement | null = document.querySelector("select");
let image: HTMLImageElement | null = null;
let submit: HTMLButtonElement | null = document.querySelector("button");

let newWidth: number | null = null;
let newHeight: number | null = null;
let rId: number = 0;
let threshold: number = 155;

fileInput?.addEventListener("change", uploadImage);
filterInput?.addEventListener("change", matchFilter);
widthInput?.addEventListener("change", (e: Event): void => {
	e.preventDefault();
	newWidth = widthInput!.value == undefined ? null : parseInt(widthInput!.value);
});
heightInput?.addEventListener("change", (e: Event): void => {
	e.preventDefault();
	newHeight = heightInput!.value == undefined ? null : parseInt(heightInput!.value);
});
submit?.addEventListener("click", runEditor);

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;

let definedFilters: string[] = [
	"greyscale",
	"flip-horizontally",
	"flip-vertically",
	"rotate 90d left",
	"rotate 90d right",
	"binarization"];//"bw", "fh", "fv", "r9l", "r9r", "tb"

let filters: Map<string, boolean> = new Map();
filters.set("greyscale", false);
filters.set("flip-horizontally", false);
filters.set("flip-vertically", false);
filters.set("rotate 90d left", false);
filters.set("rotate 90d right", false);
filters.set("binarization", false);


function uploadImage(e: Event): void {
	let file: FileList | null = fileInput == null ? null : fileInput.files;

	if (image) return;

	image = new Image();

	image!.onload = (): void => {
		canvas = document.createElement("canvas");
		canvas.width = image!.width;
		canvas.height = image!.height;

		ctx = canvas.getContext("2d", { willReadFrequently: true });
		ctx!.imageSmoothingEnabled = false;
		document.body.appendChild(canvas);

		ctx!.drawImage(image!, 0, 0);
	};

	image!.src = URL.createObjectURL(file![0]);
}

function appendFilter(filter: string, isbin: boolean = false): void {
	if (filters.get(filter) === true) {
		return;
	}

	let bigDiv: HTMLDivElement = document.createElement("div");
	bigDiv.classList.add("filterToApply");
	document.querySelector("#filters")!.appendChild(bigDiv);
	if (!isbin) {
		bigDiv.innerHTML = "<p> " + filter + " </p> <button id=remove" + rId + "> remove </button>";
	} else {
		bigDiv.innerHTML = "<p> " + filter + " </p> <button id=remove" + rId + "> remove </button><input id=param type=number>";
		let param: HTMLInputElement | null = document.querySelector("input[id=param]");
		param!.addEventListener("change", (e: Event): void => {
			e.preventDefault();
			if (param!.value !== undefined) {
				threshold = parseInt(param!.value);
			}
			console.log(threshold);

		});
	}

	let remove: HTMLElement | null = document.getElementById(`remove${rId}`);

	let thisFilter: string = filter;

	remove!.addEventListener("click", (e: Event): void => {
		if (filters.get(thisFilter) === true) {
			filters.set(thisFilter, false);
		}
		remove!.parentElement!.remove();
	});

	filters.set(filter, true);

	rId++;
}

function matchFilter(e: Event): void {
	if (!image) return;
	switch (filterInput!.value) {
		case "bw":
			appendFilter(definedFilters[0]);
			break;
		case "fh":
			appendFilter(definedFilters[1]);
			break;
		case "fv":
			appendFilter(definedFilters[2]);
			break;
		case "r9l":
			appendFilter(definedFilters[3]);
			break;
		case "r9r":
			appendFilter(definedFilters[4]);
			break;
		case "tb":
			appendFilter(definedFilters[5], true);
			break;
	}
}

function greyscale(): void {
	let img: ImageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
	let data: Uint8ClampedArray = img.data;

	for (let y: number = 0; y < canvas.width; ++y) {
		for (let x: number = 0; x < canvas.height; ++x) {
			let index: number = (x * 4) * canvas.width + (y * 4);
			let red: number = data[index];
			let green: number = data[index + 1];
			let blue: number = data[index + 2];
			let alpha: number = data[index + 3];
			let average: number = (red + green + blue) / 3;
			data[index] = average;
			data[index + 1] = average;
			data[index + 2] = average;
			data[index + 3] = alpha;
		}
	}

	ctx!.putImageData(img, 0, 0);
};

function binarization(threshold: number): void {
	if (threshold > 255) {
		return;
	}

	let img: ImageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
	let data: Uint8ClampedArray = img.data;

	for (let y: number = 0; y < canvas.width; ++y) {
		for (let x: number = 0; x < canvas.height; ++x) {
			let index: number = (x * 4) * canvas.width + (y * 4);
			let red: number = data[index];
			let green: number = data[index + 1];
			let blue: number = data[index + 2];
			let alpha: number = data[index + 3];

			if (red > threshold || green > threshold || blue > threshold) {
				data[index] = 255;
				data[index + 1] = 255;
				data[index + 2] = 255;
			} else if (red <= threshold || green <= threshold || blue <= threshold) {
				data[index] = 0;
				data[index + 1] = 0;
				data[index + 2] = 0;
			}
		}
	}

	ctx!.putImageData(img, 0, 0);
}

function runEditor(): void {
	let scalex: number = 1;
	let scaley: number = 1;
	let translateValue: number = 0;
	let angle: number = 0;

	if (newWidth !== null) {
		image!.width = newWidth;
		canvas.width = newWidth;
		ctx!.drawImage(image!, 0, 0, newWidth, canvas.height);
	}
	if (newHeight !== null) {
		image!.height = newHeight;
		canvas.height = newHeight;
		ctx!.drawImage(image!, 0, 0, canvas.width, newHeight);
	}
	if (newWidth !== null && newHeight !== null) {
		ctx!.drawImage(image!, 0, 0, newWidth, newHeight);
	}

	if (filters.get("binarization")) {
		binarization(threshold);
	}
	if (filters.get("greyscale") === true) {
		greyscale();
	}
	if (filters.get("flip-horizontally") === true) {
		scalex = -1;
	}
	if (filters.get("flip-vertically") === true) {
		scaley = -1;
	}
	if (filters.get("rotate 90d left") === true) {
		angle = (angle + 90) % 360;
		translateValue = Math.abs(canvas.width - canvas.height) / 2;
	}
	if (filters.get("rotate 90d right") === true) {
		angle = (angle - 90) % 360;
		translateValue = Math.abs(canvas.width - canvas.height) / 2;
	}

	canvas.setAttribute("style", "transform: scale(" + scalex + "," + scaley + ") translateY(" + translateValue + "px) rotate(" + angle + "deg) ");


	let bigDiv: HTMLDivElement = document.createElement("div");
	bigDiv.innerHTML = "<button><a style=text-decoration:none;color:black href=" + canvas.toDataURL() + " download>get Image</a></button>";
	document.querySelector("body")!.appendChild(bigDiv);
}
