import type { Prompt } from "@/lib/prompts";
import type { DnDStats } from "./pluginData";
import type { StoredState } from "@/lib/state";

/**
 * Modifies the protagonist generation prompt for D&D 5e rules.
 * For now, it simply returns the original prompt without modification.
 * @param originalPrompt - The original prompt for protagonist generation.
 * @returns The modified prompt.
 */
export function modifyProtagonistPromptForDnd(originalPrompt: Prompt): Prompt {
  // For now, simply return the original prompt.
  return originalPrompt;
}


/**
 * The coreAttributesContent string provides descriptive guidance for D&D 5e attributes.
 */
const coreAttributesContent = `
In Dungeons & Dragons 5th Edition, ability scores range from 1 to 10, with 10-11 being the average for a commoner. While the game provides numerical modifiers, a descriptive interpretation helps bring characters to life. Here's a complete example for each main stat, from lowest to highest:

## Strength

**Strength** measures bodily power, athletic training, and the extent to which you can exert raw physical force.

* **3 (Mod. -4):** **Morbidly Weak.** You struggle to lift your own limbs. Basic movements are a Herculean effort. You'd likely need help to stand and could be knocked over by a strong breeze.
* **4-5 (Mod. -3):** **Feeble.** Visibly weak and frail. You might be able to pick up a small child, but anything more is a serious strain. Swinging even a light weapon might throw you off balance.
* **6-7 (Mod. -2):** **Weak.** You struggle with anything heavier than a light load. Pushing an object your own weight is a significant challenge. You're easily winded by physical exertion.
* **8-9 (Mod. -1):** **Below Average.** You can perform basic physical tasks, but you're not particularly strong. Lifting heavy objects for an extended time is difficult. You'd probably be one of the last picked for a team in a physically demanding task.
* **10-11 (Mod. 0):** **Average.** You're capable of typical physical labor for a few hours. You can pull your own weight and lift moderately heavy objects for short periods. This is the common human average.
* **12-13 (Mod. +1):** **Competent.** You're noticeably stronger than the average person. You can carry heavy objects, throw small objects with decent force, and perform physical labor for half a day without excessive fatigue.
* **14-15 (Mod. +2):** **Strong.** You're visibly toned and capable. You can easily carry heavy objects with one arm and are not easily exhausted by physical exertion. You'd stand out in a crowd for your physique.
* **16-17 (Mod. +3):** **Very Strong.** Muscular and powerful. You can break objects like wood with your bare hands and perform heavy physical labor for several hours. You'd be competitive in most strength challenges.
* **18-19 (Mod. +4):** **Heavily Muscular/Near Peak Human.** Your strength borders on legendary for a mortal. You can bend steel bars, easily lift and throw grown individuals, and are a force of nature in a direct physical confrontation.
* **20-21 (Mod. +5):** **Legendary.** Your strength is beyond what most consider possible. You can effortlessly tear through thick materials, lift small carts, and single-handedly overcome obstacles that would require a team of lesser individuals.
* **22-23 (Mod. +6):** **Superhuman.** You are a physical marvel, easily confused for a minor giant or demigod. You can shatter boulders with a punch and rip trees from the ground.
* **24-25 (Mod. +7):** **Mythic.** Your raw physical power is truly astounding, capable of feats of strength that defy mortal understanding. You might be able to throw siege weapons or punch through reinforced walls.
* **26-27 (Mod. +8):** **Godlike (Lesser).** You possess strength that few mortals could ever hope to attain, hinting at divine lineage or immense magical power.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your strength approaches the might of true deities, capable of altering the landscape with your bare hands.
* **30 (Mod. +10):** **Divine.** You possess the strength of a god. Your physical might is virtually boundless, allowing you to reshape reality through sheer force.

## Dexterity

**Dexterity** measures agility, reflexes, and balance.

* **3 (Mod. -4):** **Barely Mobile.** You are severely uncoordinated, likely due to a physical disability or paralysis. Basic movements are painful and require extreme effort.
* **4-5 (Mod. -3):** **Clumsy.** You frequently stumble, drop things, and struggle with tasks requiring manual precision. You move slowly and deliberately to avoid accidents.
* **6-7 (Mod. -2):** **Awkward.** You're graceless and slow to react. You might trip over your own feet occasionally and have difficulty with fine motor skills like sewing or picking up small objects quickly.
* **8-9 (Mod. -1):** **A Bit Ungainly.** You're somewhat slow and occasionally trip or bump into things. You're not particularly agile, but generally functional.
* **10-11 (Mod. 0):** **Average.** You have typical balance and hand-eye coordination. You can catch a small tossed object, and perform basic precise tasks if needed, though not exceptionally well.
* **12-13 (Mod. +1):** **Nimble.** You're well-poised and balanced. You move with a degree of grace and are capable of precise manipulations. You can generally handle an obstacle course with some effort.
* **14-15 (Mod. +2):** **Adept.** You move elegantly and can manipulate objects with care and precision. You can often hit small targets and skillfully navigate challenging terrain.
* **16-17 (Mod. +3):** **Graceful.** You have excellent control over your body, moving with the fluidity of a dancer or a trained acrobat. You're capable of extremely subtle and precise tasks, hitting moving targets with ease.
* **18-19 (Mod. +4):** **Lithe/Peak Human Agility.** Your agility is bordering on the incredible. You can perform complex acrobatic maneuvers, dodge a barrage of projectiles, and pick even intricate locks with astonishing speed.
* **20-21 (Mod. +5):** **Uncanny Agility.** You move like water, reacting to all situations with almost no effort. You can dodge a large number of thrown objects simultaneously and traverse difficult terrain as if it were flat ground.
* **22-23 (Mod. +6):** **Superhuman Agility.** Your reflexes and control are beyond mortal comprehension. You can perceive and react to threats before others even register them, moving with impossible speed and precision.
* **24-25 (Mod. +7):** **Mythic Agility.** You can disappear and reappear seemingly at will, or move so fast that you appear to be in multiple places at once. Your movements are a blur to the untrained eye.
* **26-27 (Mod. +8):** **Godlike (Lesser).** You possess agility that rivals minor deities, capable of feats of impossible evasion and acrobatic brilliance.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your agility is on par with true deities. You can move with such speed and grace that you seem to transcend physical limitations.
* **30 (Mod. +10):** **Divine.** You embody pure agility. Your movements are perfect, anticipating and reacting to any event with flawless execution.

## Constitution

**Constitution** measures health, stamina, and vital force.

* **3 (Mod. -4):** **Frail/Mortally Ill.** Your body is barely functioning. You have a minimal immune system, are constantly exhausted, and likely suffer from chronic illness or multiple broken bones. A strong cough might put you in critical condition.
* **4-5 (Mod. -3):** **Delicate.** You bruise very easily, are prone to sickness, and can be knocked unconscious by a light punch. You have very little stamina and tire quickly.
* **6-7 (Mod. -2):** **Unhealthy.** You're unusually prone to disease and infection, easily winded, and struggle with prolonged physical activity. You often feel unwell.
* **8-9 (Mod. -1):** **Fragile.** You're easily winded and can't endure a full day of hard labor without needing significant rest. You might occasionally catch mild illnesses.
* **10-11 (Mod. 0):** **Average.** You're in typical health. You might occasionally contract mild sicknesses, but you recover normally. You can handle a standard workday.
* **12-13 (Mod. +1):** **Sturdy.** You're in good health and fairly fit. You can take a few hits before being knocked unconscious and can labor for extended periods without undue fatigue.
* **14-15 (Mod. +2):** **Hardy.** You easily shrug off most illnesses and can endure significant physical punishment. You're capable of working twelve hours most days with little complaint.
* **16-17 (Mod. +3):** **Tough.** Physically robust and resilient. You rarely get sick, can shrug off serious injuries, and can stay awake and active for days on end without significant rest.
* **18-19 (Mod. +4):** **Iron Will/Peak Human Endurance.** Your body is a fortress. You are incredibly difficult to sicken, poison, or injure, and you can push through pain and exhaustion far beyond normal limits.
* **20-21 (Mod. +5):** **Indomitable.** Your physical resilience is almost unnatural. You can survive wounds that would be instantly fatal to others, endure extreme environments, and resist nearly all forms of physical affliction.
* **22-23 (Mod. +6):** **Superhuman Endurance.** Your body is an engine of pure resilience. You can regenerate from grievous wounds with startling speed and are virtually immune to most mundane threats to your health.
* **24-25 (Mod. +7):** **Mythic Endurance.** You are a living testament to unyielding fortitude. You can withstand cataclysmic forces and continue fighting long after any normal creature would have perished.
* **26-27 (Mod. +8):** **Godlike (Lesser).** Your very being defies physical limitations, hinting at an eternal nature or divine protection.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your endurance approaches the might of true deities, capable of altering the landscape with your bare hands.
* **30 (Mod. +10):** **Divine.** You are the embodiment of vital force. You are immortal and unyielding, effectively immune to all but the most powerful cosmic forces.

## Intelligence

**Intelligence** measures mental acuity, accuracy of recall, and the ability to reason.

* **3 (Mod. -4):** **Animalistic.** You are barely sentient, incapable of logic or reason. Your behavior is reduced to simple reactions to immediate stimuli, perhaps akin to a very simple-minded animal.
* **4-5 (Mod. -3):** **Dim-witted.** You have extremely limited speech and knowledge, often resorting to charades to express simple thoughts. You struggle with basic concepts and forget details easily.
* **6-7 (Mod. -2):** **Slow-witted.** You have trouble following trains of thought, often misuse or mispronounce words, and forget most unimportant things. Learning new concepts is a slow and frustrating process.
* **8-9 (Mod. -1):** **Forgetful/Unimaginative.** You make more errors than usual when reasoning and might struggle to retain complex knowledge. You're not unintelligent, but you're not particularly quick or insightful.
* **10-11 (Mod. 0):** **Average.** You know what you need to know to get by. You can reason effectively for most daily tasks and retain general knowledge. This is the common human average.
* **12-13 (Mod. +1):** **Bright.** You know a bit more than is necessary and are fairly logical. You can grasp new concepts relatively quickly and are generally quick-witted in conversation.
* **14-15 (Mod. +2):** **Intelligent.** You are fairly intelligent, able to understand new tasks quickly and perform complex mental calculations. You can often solve logic puzzles mentally with reasonable accuracy.
* **16-17 (Mod. +3):** **Very Intelligent.** You possess a keen mind, capable of deep analysis and abstract thought. You might invent new processes or uses for knowledge and readily connect disparate ideas.
* **18-19 (Mod. +4):** **Highly Intelligent/Genius.** You are highly knowledgeable and probably the smartest person many people know. You can make Holmesian leaps of logic and master complex subjects with remarkable speed.
* **20-21 (Mod. +5):** **Exceptional Genius.** You are famous as a sage and a genius, capable of groundbreaking discoveries and solving problems that baffle others. Your mind works at an incredible pace.
* **22-23 (Mod. +6):** **Superhuman Intellect.** Your mental faculties operate on a different plane. You can process information at an astonishing rate, hold multiple complex thoughts simultaneously, and instantly recall vast amounts of information.
* **24-25 (Mod. +7):** **Mythic Intellect.** Your intellect borders on the cosmic. You might be able to understand complex magical theories at a glance, devise strategies with incredible foresight, or even comprehend impossible concepts.
* **26-27 (Mod. +8):** **Godlike (Lesser).** Your mind approaches that of a minor deity, capable of understanding and manipulating fundamental forces of reality through sheer mental power.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your intellect is on par with true deities. You possess omniscience within a certain domain, capable of comprehending the universe's most profound mysteries.
* **30 (Mod. +10):** **Divine.** You are the embodiment of pure intellect. Your knowledge is boundless, and your understanding encompasses all things.

## Wisdom

**Wisdom** measures perception, intuition, insight, and common sense.

* **3 (Mod. -4):** **Oblivious/Barely Aware.** You are seemingly incapable of thought or barely aware of your surroundings. You might stare blankly or miss obvious threats.
* **4-5 (Mod. -3):** **Unobservant.** You rarely notice important or prominent items, people, or occurrences. You seem incapable of forethought and are easily surprised or misled.
* **6-7 (Mod. -2):** **Foolish.** You often fail to exert common sense, make rash decisions, and are prone to overlooking crucial details. You're easily tricked or caught off guard.
* **8-9 (Mod. -1):** **Inattentive.** You might forget or opt not to consider all options before taking action. You're generally well-meaning but prone to errors in judgment and perception.
* **10-11 (Mod. 0):** **Average.** You make reasoned decisions most of the time and have a decent awareness of your surroundings. You're generally sensible. This is the common human average.
* **12-13 (Mod. +1):** **Perceptive.** You have a good eye for detail and are capable of reading people fairly well. You can often tell when a person is upset or lying.
* **14-15 (Mod. +2):** **Insightful.** You read people and situations very well and often get strong hunches about a situation that doesn't feel right. You're rarely surprised and notice subtle clues others miss.
* **16-17 (Mod. +3):** **Keen-witted.** You are keenly aware of your environment and changes within it, seldom missing a clue, insinuation, or lie. You possess excellent judgment and intuition.
* **18-19 (Mod. +4):** **Profoundly Wise/Preternatural Awareness.** You are often sought out for your wisdom and are a natural leader in difficult situations. You seem to anticipate events before they happen and possess an almost preternatural awareness.
* **20-21 (Mod. +5):** **Sage-like.** Your wisdom is legendary. You possess perfect awareness of surroundings, context, and implications, making it extremely hard to get anything past you. You are a fount of practical knowledge.
* **22-23 (Mod. +6):** **Superhuman Perception.** Your senses are incredibly acute, and your intuition is infallible. You can perceive hidden truths and insights others can't even fathom.
* **24-25 (Mod. +7):** **Mythic Awareness.** Your perception extends beyond the mundane, allowing you to sense magic, spirits, or even faint echoes of past events. You are rarely truly surprised.
* **26-27 (Mod. +8):** **Godlike (Lesser).** Your wisdom rivals that of minor deities, granting you glimpses into fate or the true nature of reality.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your wisdom is on par with true deities. You understand the fundamental truths of existence and the intricate workings of the cosmos.
* **30 (Mod. +10):** **Divine.** You embody pure wisdom. Your understanding is absolute, and your intuition is flawless, allowing you to perceive all things as they truly are.

## Charisma

**Charisma** measures your ability to interact effectively with others, reflecting confidence, eloquence, and force of personality.

* **3 (Mod. -4):** **Repellent.** You are profoundly hateful, utterly tactless, and possess no empathy. People are instinctively repulsed by you or find you incredibly boring.
* **4-5 (Mod. -3):** **Off-putting.** You are deeply disagreeable, whether through extreme incompetence, malice, or utter blandness. You have trouble even thinking of others as people and how to interact with them.
* **6-7 (Mod. -2):** **Unlikable.** You are terribly reticent, uninteresting, or rude. You frequently make gaffes and have difficulty connecting with others.
* **8-9 (Mod. -1):** **Awkward.** You're somewhat socially inept or dull. You might make people mildly uncomfortable or struggle to find the right words in conversation.
* **10-11 (Mod. 0):** **Average.** You are capable of polite conversation and can generally navigate social situations without major issues. You're neither particularly charming nor particularly off-putting. This is the common human average.
* **12-13 (Mod. +1):** **Personable.** You are mildly interesting and know what to say to the right people. You can make a good first impression and hold your own in a debate.
* **14-15 (Mod. +2):** **Charming.** You are often popular or infamous, possessing assured social skills. You know what to say to most people and can confidently lead a conversation or argument.
* **16-17 (Mod. +3):** **Compelling.** You are quickly likeable, respected, or feared by many. You are very eloquent, persuasive, and possess a strong force of personality that draws others to you (or makes them wary).
* **18-19 (Mod. +4):** **Magnetic/Peak Human Presence.** Your presence lights up a room, and people are immediately drawn to you. Even your worst enemies can't help but respond to your words. You are a natural leader, orator, or performer.
* **20-21 (Mod. +5):** **Inspirational.** You possess a truly captivating personality. You can inspire devotion, command legions, and sway the hearts and minds of entire crowds with your words and actions.
* **22-23 (Mod. +6):** **Superhuman Presence.** Your force of personality is overwhelming. You can charm beings resistant to mundane influence, and your mere presence can instill awe or dread.
* **24-25 (Mod. +7):** **Mythic Presence.** You radiate an aura of power and conviction that few can resist. Your words can bend the will of others, and your influence spans vast distances.
* **26-27 (Mod. +8):** **Godlike (Lesser).** Your charisma rivals that of minor deities, granting you the ability to inspire cults, lead nations, or influence the very fabric of social order.
* **28-29 (Mod. +9):** **Godlike (Greater).** Your charisma is on par with true deities. You can command loyalty from legions of followers and sway even the most powerful of beings with your presence.
* **30 (Mod. +10):** **Divine.** You are the embodiment of pure charisma. Your presence is irresistible, your words are law, and your force of personality can shape the very beliefs and emotions of others.
`;

/**
 * Constructs a Prompt object for protagonist generation based on D&D 5e rules.
 * @param stats - The D&D 5e character stats.
 * @param pc - The current player character state.
 * @returns A Prompt object with system and user messages for protagonist generation.
 */
export function getBackstory(stats: DnDStats, pc: StoredState): Prompt { //rename to getStatsInterpretations
  return {
    system: "You are an expert DM in Dungeons & Dragons 5th Edition in the narrative style of famous DM Matt Mercer. Your task is to provide a descriptive interpretation of a character's attributes based on their numerical values and the provided D&D 5e rules.",
    user: `Given the following D&D 5e attribute scores:
Strength: ${stats.strength}
Dexterity: ${stats.dexterity}
Constitution: ${stats.constitution}
Intelligence: ${stats.intelligence}
Wisdom: ${stats.wisdom}
Charisma: ${stats.charisma}
Level: ${stats.dndLevel}
Class: ${stats.dndClass}
SubClass: ${stats.dndSubclass}
Gender: ${pc.protagonist.gender}
Race: ${pc.protagonist.race}

And the following descriptive guidance from D&D 5e rules:
${coreAttributesContent}

Provide a concise, narrative-friendly description of the character's core attributes, incorporating the descriptive interpretations. Focus on how these attributes would manifest in the character's personality, physical presence, and abilities. Based on the pattern of the attributes add a couple of backstory to explain the outlier attributes tied to the gender, race during upbringing and the eventual growth to their class and subclass (if applicable). Do not include the numerical values in your description.`,
  };
}

const coreSkillsAndDifficultyCheckContent = `
In Dungeons & Dragons 5th Edition, there are 18 skills, each tied to one of the six core ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).

Here's the full list, grouped by their associated ability score:

Strength (STR)
Athletics: Covers difficult physical tasks like climbing, jumping, and swimming, or feats of strength like grappling.

Dexterity (DEX)
Acrobatics: Used for maintaining balance, tumbling, flips, or intricate maneuvers.
Sleight of Hand: For acts of manual trickery, such as picking pockets, concealing objects, or performing illusions with your hands.
Stealth: For hiding, moving silently, or avoiding detection.

Intelligence (INT)
Arcana: Measures your knowledge of spells, magic items, arcane symbols, magical traditions, and the planes of existence.
History: Recalling lore about historical events, legendary figures, ancient kingdoms, and past conflicts.
Investigation: Used when you're looking for clues, making deductions, and interpreting evidence (e.g., finding a hidden object, discerning the weak point of a structure).
Nature: Measures your knowledge of terrain, plants, animals, weather, and natural cycles.
Religion: Recalling lore about deities, rites, prayers, religious hierarchies, holy symbols, and the practices of cults.

Wisdom (WIS)
Animal Handling: For calming, influencing, or understanding animals.
Insight: Used to determine the true intentions of a creature, such as detecting lies or predicting someone's next move.
Medicine: For diagnosing illnesses, stabilizing dying creatures, and administering first aid.
Perception: For detecting your surroundings, noticing hidden objects, hearing faint sounds, or spotting ambushes. This is often one of the most frequently rolled skills.
Survival: For tracking, foraging for food and water, navigating wilderness, and identifying natural signs.

Charisma (CHA)
Deception: For convincingly hiding the truth, whether through lies, misleading actions, or disguises.
Intimidation: Attempting to influence someone through overt threats, hostile actions, or displays of physical prowess.
Performance: Used to entertain an audience through music, dance, acting, storytelling, or other forms of showmanship.
Persuasion: For influencing someone or a group with tact, social graces, or good nature.

In Dungeons & Dragons 5th Edition, DC stands for Difficulty Class. It's a target number that a player must meet or exceed with an ability check, saving throw, or attack roll to succeed at a task. The higher the DC, the harder the task.

While there isn't a strictly defined list for every increment (like DC 1, DC 2, DC 3, etc.), the Dungeon Master's Guide (DMG) and Player's Handbook (PHB) provide guidelines for common DCs and what they represent. Here's a breakdown of the generally accepted DC tiers, their definitions, and examples:

DC 0 (Automatic Success / Trivial)

Definition: A task that is so simple it doesn't even require a roll. There's no real chance of failure unless an external factor interferes.
Example: Opening an unlocked and unjammed door. Picking up a dropped coin. Taking a step forward.
DC 1-4 (Very Easy / Trivial but Possible Failure)

Definition: A task that almost anyone could succeed at with minimal effort, but a truly unlucky roll (a natural 1) might still lead to failure. Often used for basic actions where time isn't a factor.
Example:
DC 1: Remembering a very common historical fact.
DC 3: Recognizing a common animal from a distance.
DC 4: Keeping your balance on a wide, flat beam.

DC 5 (Very Easy)
Definition: A task that is very simple, and most characters with even a minimal bonus in the relevant ability can succeed without issue.
Example:
Recalling common knowledge about a local village.
Climbing a knotted rope.
Spotting a large, obvious trap.
Following a very clear trail.

DC 10 (Easy)
Definition: A task that requires a bit of effort or focus but is generally achievable for someone with some training or natural aptitude. This is a very common default DC.
Example:
Persuading a guard to let you pass with a plausible story.
Jumping across a 10-foot gap.
Picking a simple lock.
Disarming a basic, visible trap.
Tracking a single creature through soft mud.
Remembering details about a regional deity.

DC 15 (Medium)
Definition: A task that presents a noticeable challenge, requiring a character to be competent in the relevant skill or to get lucky. This is the typical DC for moderate challenges.
Example:
Convincing a reluctant merchant to give you a discount.
Climbing a rough, crumbling wall.
Picking a complex lock.
Spotting a well-hidden tripwire in a dark hallway.
Identifying a rare monster from its tracks.
Recalling obscure lore about an ancient artifact.

DC 20 (Hard)
Definition: A task that is difficult and requires significant skill, specific training, or excellent luck. Only characters proficient in the relevant skill will consistently succeed.
Example:
Calming a panicked crowd during a riot.
Leaping over a deep chasm.
Picking a masterwork lock.
Disarming a complex, magical trap.
Tracking a ghost through a bustling city street.
Identifying a rare magical disease.

DC 25 (Very Hard)
Definition: A task that is exceptionally challenging, often requiring highly specialized skill, extraordinary effort, or powerful magic. Even proficient characters will struggle.
Example:
Intimidating a powerful noble or king.
Breaking free from adamantine manacles.
Crafting a legendary magic item without proper tools.
Deactivating a powerful arcane ward.
Recalling the exact wording of a forgotten prophecy.

DC 30 (Nearly Impossible / Legendary)
Definition: A task that is incredibly difficult, bordering on the impossible without epic abilities, extreme preparation, or divine intervention. Success implies a truly heroic feat.
Example:
Persuading a high-ranking devil to betray its master.
Single-handedly holding up a collapsing cavern roof.
Picking a lock on a vault designed by a demigod.
Disarming a trap that would devastate a small town.
Reconstructing the true history of a long-lost civilization from fragments.

Key Considerations for DMs:
Context Matters: The same action can have different DCs depending on the circumstances. (e.g., swimming in calm water vs. swimming in a stormy sea).
Player Creativity: Reward clever solutions. A good plan might lower the DC, or even negate the need for a roll entirely.
Consequences of Failure: Failure should be interesting, not just a dead end. What happens if they fail the check?
Proficiency and Expertise: Characters with proficiency in a skill add their proficiency bonus. Characters with Expertise double their proficiency bonus, making higher DCs more achievable for them.
`;

/**
 * @function getChecksPrompt
 * @description Constructs a prompt for the LLM to determine required checks for a given action.
 * @param {string} action - The action for which to determine checks.
 * @returns {Prompt} The constructed prompt.
 */
export function getChecksPrompt(action: string, plotType: string): Prompt {
  let initiativeGuidance = "";
  if (plotType !== "combat") {
    initiativeGuidance = `If the action or situation clearly indicates the start of a combat encounter (e.g., an attack, an ambush, a trap being sprung), include an \"initiative\" check with a difficultyClass of 0 (the actual initiative roll will be handled by the game engine). Do NOT include an \"initiative\" check if the plotType is already \"combat\", current plotType is ${plotType}.`;
  }

  return {
    system: `You are an expert DM in Dungeons & Dragons 5th Edition in the narrative style of famous DM Matt Mercer. Your task is to analyze a given action or situation and determine if a skill check is required and if so, what are the most appropriate D&D 5e skill checks required to resolve it. 
    ${initiativeGuidance}
    You must return an array of CheckDefinition objects in JSON format.

Each CheckDefinition object must have the following properties:
- 'type': A string representing the skill (e.g., \"athletics\", \"stealth\", \"perception\") or attribute (e.g., \"strength\", \"dexterity\", \"intelligence\", \"wisdom\", \"charisma\", \"constitution\") being checked, or \"to-hit\" for attack rolls, or \"initiative\" for combat initiation.
- 'difficultyClass': A number representing the target number to beat for a successful check, or the AC of the target if this is an attack roll \"to-hit\".
- 'modifiers': An optional array of strings representing the character attributes relevant to the check (e.g., [\"strength\", \"dexterity\"]).

Your output must be a JSON array of CheckDefinition objects, and nothing else. For example:
[
  {
    "type": "stealth",
    "difficultyClass": 5,
    "modifiers": ["dexterity"]
  },
  {
    "type": "perception",
    "difficultyClass": 10,
    "modifiers": ["wisdom"]
  }

]
You should consider the context of the action/situation and the typical challenges associated with it in a D&D 5e setting. 
If multiple checks are appropriate, list them all. 
Trivial tasks like accepting an offer, believing in someone, giving or receiving an item/goods are automatic success so all difficultyClass for these are set to 0,
Here are the D&D 5e core skills and guidelines for difficulty classes:
${coreSkillsAndDifficultyCheckContent}

]`, 
    user: ` Given the situation/action: "${action}", does it require a skill check?
    if so which D&D 5e skill check(s) / saving throw is required? If multiple checks are appropriate, list them all.
    if you can not determine what specific check is needed, return an empty array.
    Provide your answer as a JSON array of CheckDefinition objects.`, 
  };
}

/**
 * Generates a prompt for an LLM to interpret check results and provide narrative guidance.
 * The LLM is instructed to consider proximity to DC and critical rolls.
 * @param sceneNarration The current scene narration text.
 * @param actionText The action text that led to the checks.
 * @param checkResult An array of strings describing the check outcomes.
 * @returns A Prompt object for the internal LLM call.
 */
export function getConsequenceGuidancePrompt(sceneNarration: string, actionText: string, checkResult: string[]): Prompt {
  const allCheckResults = checkResult.length > 0
    ? `Check Results:\n${checkResult.join('\n')}`
    : "No specific checks were needed for this action.";

  return {
    system: `You are an expert DM in Dungeons & Dragons 5th Edition in the narrative style of famous DM Matt Mercer. Your task is to interpret the outcome of an action based on the provided scene, action, and D&D 5e skill check results.
    Consider how close the roll was to the Difficulty Class (DC). A natural 1 on the roll is a critical failure, and a natural 20 is a critical success.
    Based on your interpretation, provide concise narrative guidance for the consequences of the action like what was information gained/missed, 
    item exchanged, key item lost, altering relationship, leads to combat, or disastrous outcome, etc...`,
    
    user: `Current scene:
    ${sceneNarration}

    Action taken:
    ${actionText}

    ${allCheckResults}

    Trivial actions like accepting a task/quest or acknowledge someone's point of view is auto success regardless of the DC check results 
    (disregard the result text favoring the story progression), you may add flavor to the guidance but it should not impact the automatic nature of trivial tasks. 
    Provide narrative guidance for the action's possible consequences based on these inputs. 
    Focus on the immediate consequences of the action and how the story could unfold, 
    including any twists or unexpected developments in bullet points.
    The guidance should be concise and focused on the action's outcome, like:
    - what was information gained/missed, 
    - item exchanged, 
    - key item gained/lost, 
    - altering relationship, 
    - leads to combat, 
    - or disastrous outcome, etc... 
    DO NOT narrate, or write story paragraphs, only provide clear and concise of possible ideas based on the situation in one single sentence for each check result.
    Avoid repeating information already present in the scene or action text.`,
  };
}

//Player may specify the D&D 5e rules to include in the narration. or perhaps the DM may want to specify the style of narration.
const dndRulesDMStyle = "Ensure your narration aligns with D&D 5e fantasy themes, character abilities, and typical role-playing scenarios that the famous DM Matt Mercer would narrate.";
const dndRulesCombat = "Narrate this as a dynamic combat scene, focusing on action and character reactions, adhering to D&D 5e combat rules.";

/**
 * Provides general D&D narrative style guidance.
 * @param eventType The type of event triggering narration (e.g., "combat", "general").
 * @returns A string containing general D&D narrative instructions.
 */
export function getDndNarrationGuidance(eventType: string): string {
  let guidance = "";
  if (eventType === "combat") {
    guidance += dndRulesCombat;
  } else {
    guidance += dndRulesDMStyle;
  }
  return guidance;
}
