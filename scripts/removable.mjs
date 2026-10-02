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

function notUsedCharacters() {
  let notUsed = [];
  for (const character of characters) {
    notUsed.push(character.id);
  }

  for (const title of titles) {
    for (const character of title.cast) {
      if (notUsed.includes(character.characterId)) {
        const index = notUsed.indexOf(character.characterId);
        if (index > -1) {
          notUsed.splice(index, 1);
        }
      }
    }
  }

  console.log("Characters in characters.json but never used:");
  for (const character of notUsed) {
    console.log(character);
  }
}

function notUsedActors() {
  let notUsed = [];
  for (const actor of actors) {
    notUsed.push(actor.id);
  }

  for (const title of titles) {
    for (const actor of title.cast) {
      if (notUsed.includes(actor.actorId)) {
        const index = notUsed.indexOf(actor.actorId);
        if (index > -1) {
          notUsed.splice(index, 1);
        }
      }
    }
  }

  console.log("Actors in actors.json but never used:");
  for (const actor of notUsed) {
    console.log(actor);
  }
}

function notUsedFranchises() {
  let notUsed = [];
  for (const franchise of franchises) {
    notUsed.push(franchise.id);
  }

  for (const title of titles) {
    if (notUsed.includes(title.franchiseId)) {
      const index = notUsed.indexOf(title.franchiseId);
      if (index > -1) {
        notUsed.splice(index, 1);
      }
    }
  }

  console.log("Franchises in franchises.json but never used:");
  for (const franchise of notUsed) {
    console.log(franchise);
  }
}

notUsedCharacters();
console.log("---");
notUsedActors();
console.log("---");
notUsedFranchises();
