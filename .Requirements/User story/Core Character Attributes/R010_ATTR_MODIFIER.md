----Do not modify this template----
###Story No###
*R010_ATTR_MODIFIER*

##Business requirements##
###1-line summary###
Calculate the attribute modifier for each of the six core attributes.
###Description###
For each core attribute, the system must calculate and display its corresponding modifier, which is derived from the attribute score using the formula: (Attribute Score - 10) / 2, rounded down.
###Business Value###
Provides the derived value used in most D&D 5e rolls (attack rolls, saving throws, skill checks), simplifying calculations for players and the system.

###User story###
As a Game Master or Player
when I am viewing a character's attributes
I want the system to automatically calculate and display the modifier for each attribute
so that I can quickly see the bonus or penalty applied to rolls based on that attribute.

###Acceptance criteria###
Given a character has defined attribute scores
When the character's attributes are displayed
Then the system calculates and displays the correct modifier for each attribute.

Scenario 1: Calculating modifier for Strength 15
Given a character has a Strength score of 15
When the system calculates the Strength modifier
Then the Strength modifier is +2 ((15-10)/2 = 2.5, rounded down to 2).

Scenario 2: Calculating modifier for Dexterity 8
Given a character has a Dexterity score of 8
When the system calculates the Dexterity modifier
Then the Dexterity modifier is -1 ((8-10)/2 = -1, rounded down to -1).

Scenario 3: Calculating modifier for Constitution 10
Given a character has a Constitution score of 10
When the system calculates the Constitution modifier
Then the Constitution modifier is +0 ((10-10)/2 = 0).