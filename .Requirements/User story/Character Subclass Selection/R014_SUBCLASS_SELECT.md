----Do not modify this template----
###Story No###
*R014_SUBCLASS_SELECT*

##Business requirements##
###1-line summary###
Allow users to select a D&D 5e character subclass based on their chosen class.
###Description###
The system should present a list of available subclasses for the character's chosen class, typically at a specific level (e.g., 3rd level for most classes).
###Business Value###
Enables further specialization and customization of a character, providing unique abilities and thematic depth.

###User story###
As a Player
when my character reaches the level for subclass selection
I want to be able to choose from the available subclasses for my character's class
so that I can further specialize my character's abilities and playstyle.

###Acceptance criteria###
Given a character has chosen a class and reached the appropriate level for subclass selection
When the subclass selection interface is displayed
Then only the subclasses relevant to the character's chosen class are presented.

Scenario 1: Selecting a Barbarian subclass
Given a Barbarian character has reached 3rd level
When the subclass selection is prompted
Then the options "Path of the Berserker", "Path of the Totem Warrior", "Path of the Ancestral Guardian", "Path of the Storm Herald", and "Path of the Zealot" are presented.

Scenario 2: Selecting a Wizard subclass
Given a Wizard character has reached 2nd level
When the subclass selection is prompted
Then the options "School of Abjuration", "School of Conjuration", "School of Divination", "School of Enchantment", "School of Evocation", "School of Illusion", "School of Necromancy", "School of Transmutation", and "War Magic" are presented.