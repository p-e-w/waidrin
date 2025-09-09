----Do not modify this template----
###Story No###
*R023_DC_DEFINE*

##Business requirements##
###1-line summary###
Define and set Difficulty Classes (DCs) for various tasks.
###Description###
The system should allow for the definition and assignment of Difficulty Classes (DCs) to various in-game tasks, representing the target number a player must meet or exceed to succeed. DCs should range from 0 (Trivial) to 30 (Nearly Impossible/Legendary).
###Business Value###
Provides a standardized mechanism for determining the success or failure of character actions, enabling fair and consistent gameplay challenges.

###User story###
As a Game Master
when I am setting up a task or challenge for players
I want to be able to define a Difficulty Class (DC) for that task
so that the system can determine the outcome of player attempts.

###Acceptance criteria###
Given a task or action is presented
When a DC is assigned to it
Then the system stores the numerical DC value for that task.

Scenario 1: Setting an Easy DC
Given a task of "Persuading a guard with a plausible story"
When the Game Master sets the DC
Then the DC is set to 10 (Easy).

Scenario 2: Setting a Hard DC
Given a task of "Picking a masterwork lock"
When the Game Master sets the DC
Then the DC is set to 20 (Hard).