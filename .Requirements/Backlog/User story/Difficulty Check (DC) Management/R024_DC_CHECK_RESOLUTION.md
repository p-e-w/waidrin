----Do not modify this template----
###Story No###
*R024_DC_CHECK_RESOLUTION*

##Business requirements##
###1-line summary###
Resolve ability/skill checks against a defined Difficulty Class (DC).
###Description###
When a character attempts a task with a defined DC, the system should perform an ability check (1d20 + relevant attribute modifier + proficiency bonus if applicable) and compare the result against the DC to determine success or failure.
###Business Value###
Automates the core mechanic of D&D 5e task resolution, providing immediate feedback on character actions.

###User story###
As a Player
when my character attempts a task that requires an ability or skill check
I want the system to automatically roll the dice, apply modifiers, and compare the result against the task's Difficulty Class (DC)
so that I can quickly see if my character succeeded or failed.

###Acceptance criteria###
Given a character attempts a task with a defined DC
When an ability/skill check is performed
Then the system calculates the total of 1d20 + attribute modifier + proficiency bonus (if proficient).
And if the total meets or exceeds the DC, the check is a success.
But if the total is less than the DC, the check is a failure.

Scenario 1: Successful Easy check
Given a character with a +4 bonus to Persuasion attempts to persuade a guard (DC 10)
When the system rolls a 7 on the d20
Then the total is 7 + 4 = 11.
And the check is a success (11 >= 10).

Scenario 2: Failed Medium check
Given a character with a +2 bonus to Athletics attempts to climb a crumbling wall (DC 15)
When the system rolls a 10 on the d20
Then the total is 10 + 2 = 12.
And the check is a failure (12 < 15).

Scenario 3: Automatic Success (DC 0)
Given a character attempts to open an unlocked door (DC 0)
When the system processes the action
Then the check is an automatic success without requiring a roll.