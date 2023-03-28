"use strict";
(() => {
  // src/index.ts
  var fileInput = document.querySelector("input[type=file]");
  var widthInput = document.querySelector("input[id=width]");
  var heightInput = document.querySelector("input[id=height]");
  var filterInput = document.querySelector("select");
  var image = null;
  var submit = document.querySelector("button");
  var newWidth = null;
  var newHeight = null;
  var rId = 0;
  var threshold = 155;
  fileInput == null ? void 0 : fileInput.addEventListener("change", uploadImage);
  filterInput == null ? void 0 : filterInput.addEventListener("change", matchFilter);
  widthInput == null ? void 0 : widthInput.addEventListener("change", (e) => {
    e.preventDefault();
    newWidth = widthInput.value == void 0 ? null : parseInt(widthInput.value);
  });
  heightInput == null ? void 0 : heightInput.addEventListener("change", (e) => {
    e.preventDefault();
    newHeight = heightInput.value == void 0 ? null : parseInt(heightInput.value);
  });
  submit == null ? void 0 : submit.addEventListener("click", runEditor);
  var canvas;
  var ctx;
  var definedFilters = [
    "greyscale",
    "flip-horizontally",
    "flip-vertically",
    "rotate 90d left",
    "rotate 90d right",
    "binarization"
  ];
  var filters = /* @__PURE__ */ new Map();
  filters.set("greyscale", false);
  filters.set("flip-horizontally", false);
  filters.set("flip-vertically", false);
  filters.set("rotate 90d left", false);
  filters.set("rotate 90d right", false);
  filters.set("binarization", false);
  function uploadImage(e) {
    let file = fileInput == null ? null : fileInput.files;
    if (image)
      return;
    image = new Image();
    image.onload = () => {
      canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      document.body.appendChild(canvas);
      ctx.drawImage(image, 0, 0);
    };
    image.src = URL.createObjectURL(file[0]);
  }
  function appendFilter(filter, isbin = false) {
    if (filters.get(filter) === true) {
      return;
    }
    let bigDiv = document.createElement("div");
    bigDiv.classList.add("filterToApply");
    document.querySelector("#filters").appendChild(bigDiv);
    if (!isbin) {
      bigDiv.innerHTML = "<p> " + filter + " </p> <button id=remove" + rId + "> remove </button>";
    } else {
      bigDiv.innerHTML = "<p> " + filter + " </p> <button id=remove" + rId + "> remove </button><input id=param type=number>";
      let param = document.querySelector("input[id=param]");
      param.addEventListener("change", (e) => {
        e.preventDefault();
        if (param.value !== void 0) {
          threshold = parseInt(param.value);
        }
        console.log(threshold);
      });
    }
    let remove = document.getElementById(`remove${rId}`);
    let thisFilter = filter;
    remove.addEventListener("click", (e) => {
      if (filters.get(thisFilter) === true) {
        filters.set(thisFilter, false);
      }
      remove.parentElement.remove();
    });
    filters.set(filter, true);
    rId++;
  }
  function matchFilter(e) {
    if (!image)
      return;
    switch (filterInput.value) {
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
  function greyscale() {
    let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = img.data;
    for (let y = 0; y < canvas.width; ++y) {
      for (let x = 0; x < canvas.height; ++x) {
        let index = x * 4 * canvas.width + y * 4;
        let red = data[index];
        let green = data[index + 1];
        let blue = data[index + 2];
        let alpha = data[index + 3];
        let average = (red + green + blue) / 3;
        data[index] = average;
        data[index + 1] = average;
        data[index + 2] = average;
        data[index + 3] = alpha;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function binarization(threshold2) {
    if (threshold2 > 255) {
      return;
    }
    let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = img.data;
    for (let y = 0; y < canvas.width; ++y) {
      for (let x = 0; x < canvas.height; ++x) {
        let index = x * 4 * canvas.width + y * 4;
        let red = data[index];
        let green = data[index + 1];
        let blue = data[index + 2];
        let alpha = data[index + 3];
        if (red > threshold2 || green > threshold2 || blue > threshold2) {
          data[index] = 255;
          data[index + 1] = 255;
          data[index + 2] = 255;
        } else if (red <= threshold2 || green <= threshold2 || blue <= threshold2) {
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function runEditor() {
    let scalex = 1;
    let scaley = 1;
    let translateValue = 0;
    let angle = 0;
    if (newWidth !== null) {
      image.width = newWidth;
      canvas.width = newWidth;
      ctx.drawImage(image, 0, 0, newWidth, canvas.height);
    }
    if (newHeight !== null) {
      image.height = newHeight;
      canvas.height = newHeight;
      ctx.drawImage(image, 0, 0, canvas.width, newHeight);
    }
    if (newWidth !== null && newHeight !== null) {
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
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
    let bigDiv = document.createElement("div");
    bigDiv.innerHTML = "<button><a style=text-decoration:none;color:black href=" + canvas.toDataURL() + " download>get Image</a></button>";
    document.querySelector("body").appendChild(bigDiv);
  }
})();
