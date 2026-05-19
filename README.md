A chrome plugin to make ChatGPT's output look like a ransom note, inspired by [Language models can only write ransom notes](https://posts.decontextualize.com/language-models-ransom-notes/) by the always-insightful Allison Parrish.

Work in progress. I thought this would take me a few hours, but I'm having trouble with being able to get the "cutouts" rotated using only CSS (and I was trying to use only CSS so that it would be easy to toggle on and off) so I put in a repository so I can come back to it. 

As of [March 7 2024](https://github.com/stringertheory/llm-ransom-note-plugin/commits/main/), it looks like this:

<img width="745" lt="Early per-letter version: each letter sits on a flat rectangular highlight in pastel yellow, pink, or cyan — no rotation, no paper texture, more marker than paper." src="https://github.com/stringertheory/llm-ransom-note-plugin/assets/1110950/c74aebc3-fe83-4c5e-aa6e-3aed50663c17">

Now, a couple years later, I fixed it up, updated the cutout styles/colors, and added options between using tokens or letters for cutouts. I'm using [`gpt-tokenizer`](https://www.npmjs.com/package/gpt-tokenizer) so, in token mode, each cutout is an actual token.

Now, as of May 19 2026, it looks like this in paper-colored-by-token mode:

<img width="811" height="487" alt="A ChatGPT response styled as a ransom note: words and letter clusters on colored paper scraps (red, blue, yellow, cream, green, white) in mixed newspaper fonts and cases, rotated at varied angles." src="https://github.com/user-attachments/assets/ae8b8b89-4a25-42b7-aaea-92b08b2e1bcd" />

In cutout-by-token mode:

<img width="806" height="385" alt="A ChatGPT response styled as a ransom note: words and letter clusters on colored paper scraps (red, blue, yellow, cream, green, white) in mixed newspaper fonts and cases, rotated at varied angles." src="https://github.com/user-attachments/assets/c692b0d5-b7d5-4050-92ae-72246441f62d" />

In individual letter mode:

<img width="805" height="473" alt="A ChatGPT response styled as a ransom note: words and letter clusters on colored paper scraps (red, blue, yellow, cream, green, white) in mixed newspaper fonts and cases, rotated at varied angles." src="https://github.com/user-attachments/assets/16e79b77-dea7-485a-a20a-73544f233b24" />

