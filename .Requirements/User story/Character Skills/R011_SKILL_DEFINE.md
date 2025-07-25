----Do not modify this template----
###Story No###
*R011_SKILL_DEFINE*

##Business requirements##
###1-line summary###
Define and associate the 18 D&D 5e skills with their respective core attributes.
###Description###
The system needs to define the 18 standard D&D 5e skills and explicitly link each skill to its governing attribute (Strength, Dexterity, Intelligence, Wisdom, or Charisma).
###Business Value###
Establishes the framework for skill checks, ensuring that skill usage correctly references the underlying attribute.

###User story###
As a Game Master or Player
when I am viewing a character's skills
I want the system to display each skill and its associated core attribute
so that I understand which attribute influences each skill check.

###Acceptance criteria###
Given the D&D 5e rules are implemented
When the skills are presented
Then each skill is correctly associated with its governing attribute.

Scenario 1: Athletics skill association
Given the skill "Athletics"
When its governing attribute is checked
Then it is associated with Strength.

Scenario 2: Stealth skill association
Given the skill "Stealth"
When its governing attribute is checked
Then it is associated with Dexterity.

Scenario 3: Arcana skill association
Given the skill "Arcana"
When its governing attribute is checked
Then it is associated with Intelligence.