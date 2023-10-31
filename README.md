# osusec.github.io

The source code for [www.osusec.org](https://www.osusec.org)!

We recently migrated from Wordpress to the static Hugo site you see now; if you see a bug, please let us know in Issues!

## Adding a blogpost

Blogposts and any other content to the website is written in Markdown. Here is [a Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/) if you need it!

### Clone the repo and create a branch

```sh
git clone git@github.com:osusec/osusec.github.io.git
git checkout -b BRANCH_NAME
git push --set-upstream origin BRANCH_NAME
```

### Have Hugo installed

Hugo is available in many [package repositories](https://gohugo.io/installation/linux/#repository-packages), as a [Docker](https://gohugo.io/installation/linux/#repository-packages), or as [prebuilt binaries](https://gohugo.io/installation/linux/#prebuilt-binaries). Choose one and open a terminal!

### Create new .md file

From the project's root directory, run 

```sh 
hugo new content/blog/BLOGPOST_NAME_HERE.md
```

Hugo will prevent you from creating a blogpost with a title that already exists for a previous blogpost. Make sure that the title you're choosing is descriptive! The title should also be in all lowercase, with spaces replaced with hyphens. See other files in the `content/blog/` folder for examples.

This will create the new blogpost file with certain 'default' information already written. To start writing:

1. Hugo will intuit your title from the URL you provide it. Edit this if need be to fix capitalization and include special characters.
2. Add your name to the `author` field.
3. Add a category (or more!) to the `categories` array. This will be array of strings like `['Club News', 'Meeting News']`. See below for a full list of available categories.
4. Add tags if appropriate (many other posts on the same topic, etc). Feel free to be creative.
5. If including a picture, provide a caption for the picture.
6. Write all content below the final `---` that denotes the file's metadata.
7. When ready, set the `draft` field to `false`.

### Commit it, push it, and open a PR!

Once finished with the blogpost, commit it:

```sh
git add content/ static/
git commit -m "added blogpost BLOGPOST_NAME"
git push
```

Navigate to your branch in Github, and create a Pull Request by clicking `Contribute` > `Open pull request`. Verify that it is merging into `base: master` and hit `Create pull request.` Finally, let other officers know in Discord that you have an open PR to be reviewed and published.

#### Blogpost Categories

| Category Name | Purpose                                                                                                |
|---------------|--------------------------------------------------------------------------------------------------------|
| Meeting Notes | Summaries of weekly general meetings. Include links to slides and announcements for next week.         |
| Club News     | Announcements of recent accomplishments, summaries of non-meeting activities, or other special events. |
| Writeups      | Writeups by club members of recent CTF Challenges they completed, explaining how they solved them.     |
| Uncategorized | Posts that don't fall into any of the other categories, such as a post used as material for a CTF.     |

#### Including photos

For "featured photos" that show as the title's background of the post itself, the website will look for JPG files that share the same URL as the post itself. For example, for the post `/blog/nsa-visit/`, the website will be looking for `/blog/nsa-visit.jpg`. The caption for this image will be set in the `caption` field in the `.md` file's metadata.

For non-featured photos, the URL can be anything you want, as you will specify it yourself in the markdown. For cleanliness, keep the image names as "extensions" of the original blog URL. For example, for `/blog/nsa-visit/`, use the URL/name of `/blog/nsa-visit-extra-image.png`. Include a caption with the image for accessibility.
