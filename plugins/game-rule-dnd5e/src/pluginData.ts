import * as z from "zod";
import type * as RpgDiceRoller from '@dice-roller/rpg-dice-roller';

/**
 * Zod schema for validating D&D character stats settings.
 * Each stat is an integer between 1 and 20.
 */
export const DndStatsSettingsSchema = z.object({
  strength: z.number().int().min(1).max(20),
  dexterity: z.number().int().min(1).max(20),
  constitution: z.number().int().min(1).max(20),
  intelligence: z.number().int().min(1).max(20),
  wisdom: z.number().int().min(1).max(20),
  charisma: z.number().int().min(1).max(20),
  dndClass: z.string(),
  dndSubclass: z.string(),
});

/**
 * TypeScript type inferred from the DndStatsSettingsSchema.
 * Represents the structure of the D&D character stats.
 */
export type DndStatsSettings = z.infer<typeof DndStatsSettingsSchema>;

/**
 * Function to generate default values for D&D character stats using dice rolls.
 * Used when no settings are provided or to fill in missing values.
 */
export const generateDefaultDndStatsSettings = (rpgDiceRoller: typeof RpgDiceRoller): DndStatsSettings => {
  const rollFormula = "4d6dl1"; // 4 six-sided dice, drop the lowest

  const rollAttribute = () => new rpgDiceRoller.DiceRoll(rollFormula).total;

  const generated = {
    strength: rollAttribute(),
    dexterity: rollAttribute(),
    constitution: rollAttribute(),
    intelligence: rollAttribute(),
    wisdom: rollAttribute(),
    charisma: rollAttribute(),
    dndClass: "",
    dndSubclass: "",
  };
  //console.log("generateDefaultDndStatsSettings generated:", generated);
  return generated;
};

export type DndClassData = {
  [key: string]: string[];
};

export const DND_CLASS_DATA: DndClassData = {
  "Barbarian": [
    "Path of the Berserker",
    "Path of the Totem Warrior",
    "Path of the Ancestral Guardian",
    "Path of the Storm Herald",
    "Path of the Zealot"
  ],
  "Bard": [
    "College of Lore",
    "College of Valor",
    "College of Glamour",
    "College of Whispers"
  ],
  "Cleric": [
    "Life Domain",
    "Light Domain",
    "Trickery Domain",
    "Knowledge Domain",
    "Nature Domain",
    "Tempest Domain",
    "War Domain",
    "Death Domain",
    "Forge Domain",
    "Grave Domain"
  ],
  "Druid": [
    "Circle of the Moon",
    "Circle of the Land",
    "Circle of Dreams",
    "Circle of the Shepherd"
  ],
  "Fighter": [
    "Champion",
    "Battle Master",
    "Eldritch Knight",
    "Arcane Archer",
    "Cavalier",
    "Samurai"
  ],
  "Monk": [
    "Way of the Open Hand",
    "Way of the Shadow",
    "Way of the Four Elements",
    "Way of the Drunken Master",
    "Way of the Kensei",
    "Way of the Sun Soul"
  ],
  "Paladin": [
    "Oath of Devotion",
    "Oath of the Ancients",
    "Oath of Vengeance",
    "Oathbreaker",
    "Oath of Conquest",
    "Oath of Redemption"
  ],
  "Ranger": [
    "Hunter",
    "Beast Master",
    "Gloom Stalker",
    "Horizon Walker",
    "Monster Slayer"
  ],
  "Rogue": [
    "Thief",
    "Assassin",
    "Arcane Trickster",
    "Inquisitive",
    "Mastermind",
    "Scout",
    "Swashbuckler"
  ],
  "Sorcerer": [
    "Draconic Bloodline",
    "Wild Magic",
    "Divine Soul",
    "Shadow Magic",
    "Storm Sorcery"
  ],
  "Warlock": [
    "The Archfey",
    "The Fiend",
    "The Great Old One",
    "The Celestial",
    "The Hexblade"
  ],
  "Wizard": [
    "School of Abjuration",
    "School of Conjuration",
    "School of Divination",
    "School of Enchantment",
    "School of Evocation",
    "School of Illusion",
    "School of Necromancy",
    "School of Transmutation",
    "War Magic"
  ]
};
