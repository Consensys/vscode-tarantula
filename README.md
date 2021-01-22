[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup>
[[  🌐  ](https://diligence.consensys.net)  [  📩  ](mailto:diligence@consensys.net)  [  🔥  ](https://consensys.github.io/diligence/)]
</sup><br/><br/>


# 👾 vscode-tarantula

This add-on uses [JoranHonig/tarantula](https://github.com/joranhonig/tarantula) to highlight the areas code that are most likely causing a failing test suite by utilizing the [tarantula fault localisation algorithm](http://spideruci.org/papers/jones05.pdf).

<img width="1195" alt="Screenshot 2021-01-22 at 11 40 06" src="https://user-images.githubusercontent.com/2865694/105480933-a8211900-5ca6-11eb-977f-7a38e147aea5.png">

* Text Editor code line highlighting
* Fault Localization Highscore view
* Tarantula raw output window


## How To
This plugin looks for the test & test coverage output provided by `solidity-coverage`. To get this output, you need to run solidity-coverage with the `--matrix` option. This will make it output two files:

`testMatrix.json` - Contains information on which lines are covered by which tests.

`mochaOutput.json` - The plain test results as provided by the mocha testing framework

This plugin will automatically see when those files are created or changed, and update your code view. 

If the test suite succeeded, then vscode shouldn't affect the editor at all. There is no bug breaking the test suite after all.

If the test suite failed however, then vscode-tarantula will give you two ways to find the reason why your test suite is failing.

1. It will highlight the lines which are suspect of breaking your test suite (the denser the background colour, the more suspect that line is)
2. You can use the window on the left to directly navigate to the lines which have the highest suspect rating.


## Credits

* [JoranHonig/tarantula](https://github.com/joranhonig/tarantula)
* [Tarantula fault localisation Algorithm Paper](http://spideruci.org/papers/jones05.pdf)
* <div>Logo made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>

## Release Notes

see [CHANGELOG](./CHANGELOG.md)


-----------------------------------------------------------------------------------------------------------
