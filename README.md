# Graasp CLI

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

A CLI to create apps and labs for the Graasp ecosystem.

## Citing

If you use the Graasp CLI in your research, please cite the following paper:

Juan Carlos Farah, Sandy Ingram, and Denis Gillet. 2022. Supporting Developers in Creating Web Apps for Education via an App Development Framework. In _HEAd'22 Conference Proceedings_ (Valencia, Spain, 2022). Editorial Universitat Politècnica de València, Valencia, Spain, 883–890. https://doi.org/10.4995/HEAD22.2022.15652

```
@inproceedings{farah2022supporting,
    title = {Supporting {Developers} in {Creating} {Web} {Apps} for {Education} via an {App} {Development} {Framework}},
    author = {Farah, Juan Carlos and Ingram, Sandy and Gillet, Denis},
    booktitle = {{HEAd}'22 {Conference} {Proceedings}},
    publisher = {Editorial Universitat Politècnica de València},
    address = {Valencia, Spain},
    year = {2022},
    pages = {883--890}
    doi = {10.4995/HEAD22.2022.15652},
}
```

🙏

## Development

To test locally, clone the repository.

Compile the library by running `yarn compile`

Move to a directory where you would like to clone a test project, e.g. `cd ~/my-apps`

Run the CLI by using the full path from that directory to the `lib` folder inside this repository.

```bash
node ~/code/graasp/tools/graasp-cli/lib new
```
