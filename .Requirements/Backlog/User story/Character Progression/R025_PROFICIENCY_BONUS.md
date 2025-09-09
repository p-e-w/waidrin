----Do not modify this template----
###Story No###
*R025_PROFICIENCY_BONUS*

##Business requirements##
###1-line summary###
Define and calculate the character's proficiency bonus based on level.
###Description###
The system should automatically determine a character's proficiency bonus, which increases at specific character levels (e.g., +2 at levels 1-4, +3 at 5-8, etc.).
###Business Value###
Provides a core scaling mechanic for character abilities, ensuring that skill checks, saving throws, and attack rolls correctly reflect a character's growing power.

###User story###
As a Player
when my character gains a level
I want the system to automatically update my character's proficiency bonus
so that my character's abilities scale correctly with their experience.

###Acceptance criteria###
Given a character's current level
When the proficiency bonus is calculated
Then the correct proficiency bonus for that level is applied.

Scenario 1: 1st-level character
Given a character is 1st level
When their proficiency bonus is determined
Then their proficiency bonus is +2.

Scenario 2: 5th-level character
Given a character is 5th level
When their proficiency bonus is determined
Then their proficiency bonus is +3.