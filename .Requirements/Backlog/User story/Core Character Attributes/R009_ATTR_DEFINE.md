----Do not modify this template----
###Story No###
*R009_ATTR_DEFINE*

##Business requirements##
###1-line summary###
Define and store the six core D&D 5e character attributes (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
###Description###
The system needs to define and store the numerical values for a character's six core attributes: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. These values typically range from 1 to 30.
###Business Value###
Establishes the foundational numerical representation of a character's innate abilities, crucial for all subsequent game mechanics.

###User story###
As a Game Master or Player
when I am creating or managing a character
I want to be able to define and view the character's Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma scores
so that the character's fundamental capabilities are accurately represented in the system.

###Acceptance criteria###
Given a new character is being created
When the character's attributes are set
Then the system stores the numerical values for Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.

Scenario 1: Setting initial attributes
Given a new character sheet is open
When I input 15 for Strength, 14 for Dexterity, 13 for Constitution, 12 for Intelligence, 10 for Wisdom, and 8 for Charisma
Then the system records these values as the character's core attributes.