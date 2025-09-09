----Do not modify this template----
###Story No###
*R016_SUBCLASS_FEATURES*

##Business requirements##
###1-line summary###
Integrate subclass-specific features into the character sheet.
###Description###
The system should display and apply the unique features and benefits granted by a character's chosen subclass (e.g., Frenzy for Path of the Berserker, Cutting Words for College of Lore).
###Business Value###
Provides the specialized abilities that differentiate characters within the same class, enhancing gameplay and character identity.

###User story###
As a Player
when I view my character sheet
I want to see all the unique features and benefits granted by my character's subclass
so that I understand my character's specialized capabilities.

###Acceptance criteria###
Given a character has a chosen class and subclass
When the character sheet is displayed
Then all features and benefits specific to that subclass are listed and applied.

Scenario 1: Path of the Berserker features
Given a character is a Barbarian with the Path of the Berserker subclass
When their character sheet is viewed
Then "Frenzy" (at 3rd level), "Mindless Rage" (at 6th level), "Intimidating Presence" (at 10th level), and "Retaliation" (at 14th level) are displayed as features.

Scenario 2: College of Lore features
Given a character is a Bard with the College of Lore subclass
When their character sheet is viewed
Then "Bonus Proficiencies" (at 3rd level), "Cutting Words" (at 3rd level), "Additional Magical Secrets" (at 6th level), and "Peerless Skill" (at 14th level) are displayed as features.