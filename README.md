# Waidrin

Waidrin is a purpose-built role-playing game engine powered by an LLM.
It is designed around an asynchronous, fully typed, fully validating state machine
that uses constrained generation based on JSON schemas to dynamically create
locations and characters as the story progresses, and keep track of them.
Waidrin produces structured narrative events, not just chat messages.
It can handle potentially thousands of characters and locations,
without ever losing sight of what is happening.

While the engine itself is headless and can power any frontend, Waidrin comes
with its own beautiful React-based frontend that is co-evolving with the engine
to drive development forward. The frontend features AI-generated artwork
that adds flavor and atmosphere to text-first storytelling.

At each turn, the player is presented with a choice of multiple AI-suggested actions,
but they can also provide a different action as freeform text. This blends a classic
CYOA experience with the limitless freedom of generative AI. It's an RPG unlike
any other.

## NOTE: This version is a fork of the original project and is purely a personal experiment. 
All modifications are done using Gemini CLI Gemini-2.5-flash model in VS code, so coding standards and method will
very likely be suboptimal. This is just a proof of concept to adopt AI tools for my BA workflow
in a development project to quickly prototype with just very basic knowledge of the stack.

## Main story interface

![Main](https://github.com/user-attachments/assets/f0040c07-86c4-456e-8b3a-c25c7ab85293)


## Genre selection screen

Note that only the fantasy genre is currently implemented.

![Genre](https://github.com/user-attachments/assets/d3d168f6-2d19-4917-8be9-cc3b2869a56a)


## Character selection screen

The system generates a suitable character name and biography from the player's
base choices. The player has the option to override those generated attributes.

![Character](https://github.com/user-attachments/assets/844eb154-4379-4331-8a69-25ff3596695a)

![Generating](https://github.com/user-attachments/assets/22c4e6b3-f891-4c00-a0a8-ce242635660e)


## Installation

Make sure you have Git and Node.js installed, then run the following commands:

```
git clone https://github.com/p-e-w/waidrin.git
cd waidrin
npm install
npm run build
```


## Running

To use Waidrin, you need a running
[llama.cpp server](https://github.com/ggml-org/llama.cpp/tree/master/tools/server)
with the model of your choice
([Mistral Small 2506](https://huggingface.co/bartowski/mistralai_Mistral-Small-3.2-24B-Instruct-2506-GGUF)
is recommended). Once you have that set up, run

```
npm run start
```

from Waidrin's installation directory, open the displayed URL in the browser,
and follow the instructions.

You can also use

```
npm run dev
```

to run in development mode, which gives you features like hot reload and
React Strict Mode, and is probably what you want if you plan to work on
Waidrin's code (which you are very welcome to do!).


## License

Copyright &copy; 2025  Philipp Emanuel Weidmann (<pew@worldwidemann.com>)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

**By contributing to this project, you agree to release your
contributions under the same license.**
