----Do not modify this template----
###Story No###
*R012_SKILL_PROFICIENCY*

##Business requirements##
###1-line summary###
Implement skill proficiency, applying the proficiency bonus to skill checks.
###Description###
The system must allow characters to gain proficiency in specific skills. When a character is proficient in a skill, their proficiency bonus should be added to any ability check made using that skill.
###Business Value###
Accurately reflects a character's training and expertise in specific areas, providing a core mechanic for skill-based challenges.

###User story###
As a Game Master or Player
when I am making a skill check for a character
I want the system to automatically include the character's proficiency bonus if they are proficient in that skill
so that the skill check accurately reflects their training and abilities.

###Acceptance criteria###
Given a character has a defined proficiency bonus
When a skill check is made
Then if the character is proficient in that skill, their proficiency bonus is added to the ability check.
But if the character is not proficient, only the attribute modifier is used.

Scenario 1: Proficient skill check
Given a character with a Dexterity score of 14 (+2 modifier) and a proficiency bonus of +2
And the character is proficient in Stealth
When a Stealth check is made
Then the total bonus for the Stealth check is +4 (Dexterity modifier +2 + Proficiency bonus +2).

Scenario 2: Non-proficient skill check
Given a character with a Strength score of 15 (+2 modifier) and a proficiency bonus of +2
And the character is not proficient in Athletics
When an Athletics check is made
Then the total bonus for the Athletics check is +2 (Strength modifier +2).