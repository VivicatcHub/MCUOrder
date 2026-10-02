import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const titlesPath = resolve(root, "src/data/catalog/titles.json");
const charactersPath = resolve(root, "src/data/catalog/characters.json");
const actorsPath = resolve(root, "src/data/catalog/actors.json");
const franchisesPath = resolve(root, "src/data/catalog/franchises.json");

const titles = JSON.parse(await readFile(titlesPath, "utf8"));
const characters = JSON.parse(await readFile(charactersPath, "utf8"));
const actors = JSON.parse(await readFile(actorsPath, "utf8"));
const franchises = JSON.parse(await readFile(franchisesPath, "utf8"));

function doubleTitles() {
  let double = [];

  let temp = [];
  for (const title of titles) {
    let casts = title.cast;
    temp = [];
    if (casts == []) continue;
    for (const cast of casts) {
      if (cast.characterId == null) continue;
      if (temp.includes(cast.characterId)) {
        double.push(title.id + ":character:" + cast.characterId);
      }
      temp.push(cast.characterId);
    }
    temp = [];
    for (const cast of casts) {
      if (cast.actorId == null) continue;
      if (temp.includes(cast.actorId)) {
        double.push(title.id + ":actor:" + cast.actorId);
      }
      temp.push(cast.actorId);
    }
  }

  temp = [];
  for (const title of titles) {
    if (title.id == null) continue;
    if (temp.includes(title.id)) {
      double.push("id:" + title.id);
    }
    temp.push(title.id);
  }

  temp = [];
  for (const title of titles) {
    if (title.title == null) continue;
    if (temp.includes(title.title)) {
      double.push("title:" + title.title);
    }
    temp.push(title.title);
  }

  console.log("Titles in titles.json more than one time:");
  for (const title of double) {
    console.log(title);
  }
}

function doubleCharacters() {
  let double = [];

  let temp = [];
  for (const character of characters) {
    if (character.id == null) continue;
    if (temp.includes(character.id)) {
      double.push(character.id);
    }
    temp.push(character.id);
  }

  temp = [];
  for (const character of characters) {
    if (character.name == null) continue;
    if (temp.includes(character.name)) {
      double.push(character.name);
    }
    temp.push(character.name);
  }

  console.log("Characters in characters.json more than one time:");
  for (const character of double) {
    console.log(character);
  }
}

function doubleActors() {
  let double = [];

  let temp = [];
  for (const actor of actors) {
    if (actor.id == null) continue;
    if (temp.includes(actor.id)) {
      double.push(actor.id);
    }
    temp.push(actor.id);
  }

  temp = [];
  for (const actor of actors) {
    if (actor.name == null) continue;
    if (temp.includes(actor.name)) {
      double.push(actor.name);
    }
    temp.push(actor.name);
  }

  temp = [];
  for (const actor of actors) {
    if (actor.photo == null) continue;
    if (temp.includes(actor.photo)) {
      double.push(actor.photo);
    }
    temp.push(actor.photo);
  }

  temp = [];
  for (const actor of actors) {
    if (actor.tmdbId == null) continue;
    if (temp.includes(actor.tmdbId)) {
      double.push(actor.tmdbId);
    }
    temp.push(actor.tmdbId);
  }

  console.log("Actors in actors.json more than one time:");
  for (const actor of double) {
    console.log(actor);
  }
}

function doubleFranchises() {
  let double = [];

  let temp = [];
  for (const franchise of franchises) {
    if (franchise.id == null) continue;
    if (temp.includes(franchise.id)) {
      double.push(franchise.id);
    }
    temp.push(franchise.id);
  }

  temp = [];
  for (const franchise of franchises) {
    if (franchise.name == null) continue;
    if (temp.includes(franchise.name)) {
      double.push(franchise.name);
    }
    temp.push(franchise.name);
  }

  console.log("Franchises in franchises.json more than one time:");
  for (const franchise of double) {
    console.log(franchise);
  }
}

doubleTitles();
console.log("---");
doubleCharacters();
console.log("---");
doubleActors();
console.log("---");
doubleFranchises();
