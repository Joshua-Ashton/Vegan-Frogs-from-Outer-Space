    (function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

var hurtfx = document.getElementById("hurt-fx");
var jumpfx = document.getElementById("jump-fx"); jumpfx.volume = 0.5;
var jump2fx = jumpfx.cloneNode();
var jump3fx = jumpfx.cloneNode();
var shootfx = document.getElementById("shoot-fx");
var tonguefx = document.getElementById("tongue-fx"); tonguefx.volume = 0.6;
var tongue2fx = tonguefx.cloneNode();
var tongue3fx = tonguefx.cloneNode();

var overworldmusic = document.getElementById("overworld-music");
//var battlemusic = document.getElementById("battle-music");
var creditsmusic = document.getElementById("credits-music");

var Layers = 
[
    "Sky",
    "Background",
    "Foreground",
    "Spawn",
    "Checkpoint",
    "Collision",
    "Damage",
    "Flower",
    "Water",
    "Text",
    "Mushroom",
];

// Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]" 
var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
var isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;

// Blink engine detection
var isBlink = (isChrome || isOpera) && !!window.CSS;

if (isEdge || isIE)
{
    document.body.innerHTML = "<p>Vegan Frogs from Outer Space does not support Internet Explorer or Microsoft Edge.</p><p>This is due to missing features.</p><p>Please get a not-crap browser.</p>";
}

var ResetPlayer = 
{
    Width: 8,
    Height: 8,
    InWater: false,
    InDamage: false,
    DamageTimer: 0,
    X: 0,
    Y: 0,
    Health: 4,
    Speed: 1,
    JumpPower: 1.25,
    SwimPower: 0.4,
    VelocityX: 0,
    VelocityY: 0,
    Noclip: false,
    TerminalVelocity: 2.5,
    LookingLeft: false,
    Moving: false,
    WallJumpOpportunity: null,
    MovementNumber: 0,
    Jumping: false,
    TongueOut: false,
    Grounded: false,
    IsPlane: false,
    TongueTimeout: 0,
    GroundedLastFrame: false,
    WallJumpTimer: 0,
    WalkAnimationTimer: 0,
    ExhaustTimer: 0,
    ExhaustState: 1,
    JustLanded: false,
    JustLandedAnimationTimer: 0,
    RespawnX: 0,
    RespawnY: 112,
};

Game =
{
    Debug: false,
    DebugScreenBoundaryClip: false,
    Rendering: 
    {
        CurrentText: null,
        Canvas: document.getElementById("canvas"),
        Context: canvas.getContext("2d"),

        Width: 213,
        Height: 120,

        TileAnimState: false,
        TileAnimTime: 0,
        TrippyFxTimer: 0,

        FrameNumber: 0
    },
    Spritesheet: new Image(),
    Keys: [],
    KeysThisFrame: [],
    MouseRightPressed: false,
    MousePressedLastFrame: false,
    MousePressed: false,
    Score: 0,
    Mouse:
    {
        X: 0,
        Y: 0
    },
    World:
    {
        Scroll:
        {
            X: 0,
            Y: 0
        },
        Player: CloneVariable(ResetPlayer),
        //GravityTerminalVelocity: 10.8,
        AirResistance: 0.99,
        NoclipNess: 0.9,
        Friction: 0.8,
        Current: 0.15,
        Gravity: 0.1,
        OceanPull: 0.02,
    },
    LevelEditor:
    {
        Enabled: false,
        SheetTileX: 0,
        EditorText: "Change Me",
        SheetTileY: 0,
        Layer: "Sky"
    },
    Screens: level
}

Game.Rendering.Canvas.width = Game.Rendering.Width;
Game.Rendering.Canvas.height = Game.Rendering.Height;

Game.Rendering.Canvas.addEventListener('mousemove', function(event) {
    Game.Mouse.X = event.clientX;
    Game.Mouse.Y = event.clientY;
}, false);

Game.Rendering.Context.mozImageSmoothingEnabled = false;
Game.Rendering.Context.webkitImageSmoothingEnabled = false;
Game.Rendering.Context.msImageSmoothingEnabled = false;
Game.Rendering.Context.imageSmoothingEnabled = false;

Game.Spritesheet.src = "sprites.png";

function Respawn()
{
    var RespawnX = CloneVariable(Game.World.Player.RespawnX);
    var RespawnY = CloneVariable(Game.World.Player.RespawnY);

    Game.World.Player = CloneVariable(ResetPlayer);

    Game.World.Player.RespawnX = RespawnX;
    Game.World.Player.RespawnY = RespawnY;
    Game.World.Player.X = Game.World.Player.RespawnX;
    Game.World.Player.Y = Game.World.Player.RespawnY;
    Game.World.Player.Health = 4;
}

function DrawSprite(xPos, yPos, indexX, indexY, alpha, width, height)
{
    if (!alpha)
        alpha = 1;

    if (!width)
        width = 8;
    
    if (!height)
        height = 8;

    Game.Rendering.Context.globalAlpha = alpha;
    Game.Rendering.Context.drawImage(Game.Spritesheet, indexX * 8, indexY * 8, 8, 8, Math.round(xPos), Math.round(yPos), width, height);
    Game.Rendering.Context.globalAlpha = 1;
}

function DrawScrollSprite(xPos, yPos, indexX, indexY, alpha, width, height)
{
    DrawSprite(xPos + Game.World.Scroll.X, yPos + Game.World.Scroll.Y, indexX, indexY, alpha, width, height);
}

function InvokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) {}
    }

    var fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.download = fileFullName;

    hyperlink.style = 'display:none;opacity:0;color:transparent;';
    (document.body || document.documentElement).appendChild(hyperlink);

    if (typeof hyperlink.click === 'function') {
        hyperlink.click();
    } else {
        hyperlink.target = '_blank';
        hyperlink.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
}

function SaveLevel()
{
    var jsonFile = new Blob([JSON.stringify(Game.Screens)], {
        type: 'application/json'
    });
    InvokeSaveAsDialog(jsonFile, 'MyLevel.json');
}

function DrawHealth()
{
    if (CreditsStart)
        return;

    if (!Game.LevelEditor.Enabled)
    {
        DrawSprite(2, 1, 0, 6);
        DrawSprite(10, 1, 5 - Game.World.Player.Health, 6);
    }
}

function BoundsIntersect(a, b)
{
    if (a.max.x < b.min.x) return false;
    if (a.min.x > b.max.x) return false;
    if (a.max.y < b.min.y) return false;
    if (a.min.y > b.max.y) return false;
    return true;
}

function GetBlockBoundaries(block)
{
    return  {
                min:
                {
                    x: block.x * 8,
                    y: block.y * 8
                },
                max:
                {
                    x: (block.x * 8) + 8,
                    y: (block.y * 8) + 8
                }
            };
}

function GetPlayerBoundaries()
{
    return  {
            min:
            {
                x: Game.World.Player.X,
                y: Game.World.Player.Y
            },
            max:
            {
                x: Game.World.Player.X + Game.World.Player.Width,
                y: Game.World.Player.Y + Game.World.Player.Height
            }
        };
}

function GetPlayerTongueBoundaries()
{
    var maxXExtra = 0;
    var minXExtra = 0;

    if (Game.World.Player.TongueOut)
    {
        if (!Game.World.Player.LookingLeft)
            maxXExtra = 16;
        else
            minXExtra = -16;
    }

    return  {
            min:
            {
                x: Game.World.Player.X + minXExtra,
                y: Game.World.Player.Y
            },
            max:
            {
                x: Game.World.Player.X + Game.World.Player.Width + maxXExtra,
                y: Game.World.Player.Y + Game.World.Player.Height
            }
        };
}

function IsPlayerInType(typeName)
{
    var screens = GetPlayerScreensBordering();
    for (var key in screens)
    {
        var layer = screens[key].screen[typeName];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = GetBlockBoundaries(layer[i]);
            var player = GetPlayerBoundaries();

            if (BoundsIntersect(block, player))
                return block;
        }
    }

    return null;
}

function IsPlayerInWater()
{
    return IsPlayerInType("Water");
}

function ProcessCheckpoints()
{
    var checkpoint = IsPlayerInCheckpoint();
    if (checkpoint)
    {
        Game.World.Player.RespawnX = checkpoint.min.x;
        Game.World.Player.RespawnY = checkpoint.min.y;
    }
}

function IsPlayerInCheckpoint()
{
    return IsPlayerInType("Checkpoint");
}

function IsPlayerInDamage()
{
    return IsPlayerInType("Damage");
}

function NewLevelLoaded()
{
    var spawnBlock = GetSpawnBlock();

    if (spawnBlock)
    {
        Game.World.Player.X = spawnBlock.x * 8;
        Game.World.Player.RespawnX = spawnBlock.x * 8;
        Game.World.Player.Y = spawnBlock.y * 8;
        Game.World.Player.RespawnY = spawnBlock.y * 8;
    }
    else
    {
        Game.World.Player.X = 0;
        Game.World.Player.RespawnX = 0;
        Game.World.Player.Y = 112;
        Game.World.Player.RespawnY = 112;
    }
}

function HandleFile(file)
{
    var reader = new FileReader();
    reader.onload = function()
    {
        try
        {
            var text = reader.result;
            Game.Screens = JSON.parse(text);

            NewLevelLoaded();

        } catch (e)
        {
            alert("Corrupt level!");
        }
    };
    reader.readAsText(file);
}

function OnDrop(event) 
{
    event.preventDefault();

    var transfer = event.dataTransfer;

    if (transfer.items && transfer.items.length > 0 && transfer.items[0].kind == "file") 
        HandleFile(transfer.items[0].getAsFile());
    else if (transfer.files && transfer.files.length > 0 && transfer.files[0].kind == "file")
        HandleFile(transfer.files[0].getAsFile());
}

function AllowDrop(event) 
{
    event.preventDefault();
}

document.body.addEventListener('dragover', AllowDrop, false);
document.body.addEventListener('drop', OnDrop, false);

function SwitchLayer()
{
    var nextObject = false;
    for (var index in Layers)
    {
        if (nextObject)
        {
            Game.LevelEditor.Layer = Layers[index];
            return;
        }

        if (Layers[index] == Game.LevelEditor.Layer)
            nextObject = true;
    }

    for (var index in Layers)
    {
        Game.LevelEditor.Layer = Layers[index];
        break;
    }
}

function GetLayer()
{
    var screen = GetPlayerScreen();
    if (screen)
        return GetPlayerScreen()[Game.LevelEditor.Layer];
    return null;
}

function GetSpawnBlock()
{
    for (var x in Game.Screens)
    {
        for (var y in Game.Screens[x])
        {
            var SpawnLayer = Game.Screens[x][y].Spawn;
            
            if (SpawnLayer && SpawnLayer.length > 0)
                return SpawnLayer[0];
        }
    }

    return null;
}

var WasTongueOutLastFrame = false;

function ProcessInput()
{   
    WasTongueOutLastFrame = Game.World.Player.TongueOut;

    if (Game.KeysThisFrame[86]) 
    {
        // Removed for Release!
        //Game.World.Player.Noclip = !Game.World.Player.Noclip;
    }

    if (Game.KeysThisFrame[76]) 
    {
        // Removed for Release!
        //Game.LevelEditor.Enabled = !Game.LevelEditor.Enabled;
    }

    if (Game.LevelEditor.Enabled)
    {
        if (Game.KeysThisFrame[75]) 
            SwitchLayer();

        if (Game.MouseRightPressed)
        {
            var block = GetLevelEditorMouseBlock();
            var layer = GetLayer();

            if (layer)
            {
                for (var i = 0; i < layer.length; i++)
                {
                    if (layer[i].x == Math.round(block.X / 8) && layer[i].y == Math.round(block.Y / 8))
                        layer.splice(i, 1);
                }
            }
        }

        if (Game.KeysThisFrame[79])
            SaveLevel();

        if (Game.KeysThisFrame[39])
            Game.LevelEditor.SheetTileX++;
        if (Game.KeysThisFrame[37])
            Game.LevelEditor.SheetTileX--;

        if (Game.KeysThisFrame[38])
            Game.LevelEditor.SheetTileY--;
        if (Game.KeysThisFrame[40])
            Game.LevelEditor.SheetTileY++;

        if (Game.LevelEditor.SheetTileX < 0)
            Game.LevelEditor.SheetTileX = 0;

        if (Game.LevelEditor.SheetTileY < 0)
            Game.LevelEditor.SheetTileY = 0;


        if (Game.MousePressed)
        {
            var block = GetLevelEditorMouseBlock();
            var blockX = Math.round(block.X / 8);
            var blockY = Math.round(block.Y / 8);

            var screenCoords = GetPlayerScreenCoordinates();

            if (
                blockX * 8 <= Game.Rendering.Width * (screenCoords.X + 1) && blockY * 8 <= Game.Rendering.Height * (screenCoords.Y + 1) &&
                blockX * 8 >= Game.Rendering.Width * screenCoords.X && blockY * 8 >= Game.Rendering.Height * screenCoords.Y
                )
            {
                var layer = GetLayer();

                if (!layer)
                {
                    var screen = GetPlayerScreen();

                    if (!screen)
                    {
                        var screenCoords = GetPlayerScreenCoordinates();
                        CreateScreen(screenCoords.X, screenCoords.Y);
                    }
                    GetPlayerScreen()[Game.LevelEditor.Layer] = [];
                    layer = GetLayer();
                }

                if (Game.LevelEditor.Layer == "Foreground" || Game.LevelEditor.Layer == "Background" || Game.LevelEditor.Layer == "Sky")
                {
                    var foundToChange = false;
                    for (var i = 0; i < layer.length; i++)
                    {
                        if (layer[i].x == blockX && layer[i].y == blockY)
                        {
                            foundToChange = true;
                            
                            if (Game.LevelEditor.SheetTileX != layer[i].sprSheetX || Game.LevelEditor.SheetTileY != layer[i].sprSheetY)
                            {
                                layer[i].animateSprSheetX = Game.LevelEditor.SheetTileX;
                                layer[i].animateSprSheetY = Game.LevelEditor.SheetTileY;
                            }
                            else
                            {
                                layer[i].sprSheetX = Game.LevelEditor.SheetTileX;
                                layer[i].sprSheetY = Game.LevelEditor.SheetTileY;
                            }
                        }
                    }

                    if (!foundToChange)
                    {
                        var obj = 
                        {
                            x: blockX,
                            y: blockY,
                            sprSheetX: Game.LevelEditor.SheetTileX,
                            sprSheetY: Game.LevelEditor.SheetTileY
                        };

                        layer.push(obj);
                    }
                }
                else
                {
                    if (Game.LevelEditor.Layer == "Spawn" && GetSpawnBlock())
                        return;

                    var foundToChange = false;
                    for (var i = 0; i < layer.length; i++)
                    {
                        if (layer[i].x == blockX && layer[i].y == blockY)
                        {
                            foundToChange = true;
                        }
                    }

                    if (!foundToChange)
                    {
                        var obj = null;
                        if (Game.LevelEditor.Layer != "Text")
                        {
                            obj = 
                            {
                                x: blockX,
                                y: blockY,
                            };
                        }
                        else
                        {
                            obj = 
                            {
                                x: blockX,
                                y: blockY,
                                text: Game.LevelEditor.EditorText
                            };
                        }

                        layer.push(obj);
                    }
                }
            }
        }

        return;
    }

    if (Game.Rendering.CurrentText)
    {
        if (Game.KeysThisFrame[88])
        {
            Game.World.Player.TongueTimeout = now + 150;
            Game.Rendering.CurrentText = null;
        }
        return;
    }

    if (Game.World.Player.TongueTimeout < now)
        Game.World.Player.TongueOut = Game.Keys[88];

    if (Game.KeysThisFrame[82]) 
    {
        Respawn();
    }

    if (Game.World.Player.Noclip || Game.World.Player.IsPlane)
    {
        Game.World.Player.Jumping = true;
        Game.World.Player.Grounded = false;

        if (Game.Keys[38])
        {
            if (Game.World.Player.VelocityY > -Game.World.Player.Speed) 
                Game.World.Player.VelocityY--;

            Game.World.Player.Moving = true;
        }

        if (Game.Keys[40])
        {
            if (Game.World.Player.VelocityY < Game.World.Player.Speed) 
                Game.World.Player.VelocityY++;

            Game.World.Player.Moving = true;
        }
    }
    else if (Game.KeysThisFrame[38] || Game.KeysThisFrame[32]) 
    {
        if( (Game.World.Player.Grounded && !Game.World.Player.InWater ) || (Game.World.Player.WallJumpTimer > now && Game.World.Player.WallJumpOpportunity != null) )
        {
            if(Game.World.Player.WallJumpTimer > now && Game.World.Player.WallJumpOpportunity != null)
            {
                Game.World.Player.WallJumpTimer = 0;

                if (Game.World.Player.WallJumpOpportunity == 'r')
                {
                    Game.World.Player.VelocityX -= Game.World.Player.Speed * 5
                    Game.World.Player.X -= 1;
                }
                else
                {
                    Game.World.Player.X += 1;
                    Game.World.Player.VelocityX += Game.World.Player.Speed * 5;
                }

                if (Game.World.Player.VelocityX > Game.World.Player.Speed * 5)
                    Game.World.Player.VelocityX = Game.World.Player.Speed * 5;

                if (Game.World.Player.VelocityX < -Game.World.Player.Speed * 5)
                    Game.World.Player.VelocityX = -Game.World.Player.Speed * 5;

                Game.World.Player.WallJumpOpportunity = null;
            }

            Game.World.Player.Y -= 4;
            Game.World.Player.Jumping = true;

            if (jumpfx.paused)
                jumpfx.play();
            else if (jump2fx.paused)
                jump2fx.play();
            else if (jump3fx.paused)
                jump3fx.play();

            Game.World.Player.Grounded = false;
            Game.World.Player.VelocityY = -Game.World.Player.JumpPower * 2;
        }
        else if (Game.World.Player.InWater)
        {
            Game.World.Player.Y -= 4;
            Game.World.Player.Jumping = true;

            if (jumpfx.paused)
                jumpfx.play();
            else if (jump2fx.paused)
                jump2fx.play();
            else if (jump3fx.paused)
                jump3fx.play();

            Game.World.Player.Grounded = false;
            Game.World.Player.VelocityY = -Game.World.Player.SwimPower * 2;
        }
    }

    if (Game.Keys[39])
    {
        if (Game.World.Player.VelocityX < Game.World.Player.Speed) 
            Game.World.Player.VelocityX++;

        Game.World.Player.TongueOut = false;
        Game.World.Player.Moving = true;
        Game.World.Player.LookingLeft = false;
    }
    if (Game.Keys[37]) 
    {
        if (Game.World.Player.VelocityX > -Game.World.Player.Speed) 
            Game.World.Player.VelocityX--;

        Game.World.Player.TongueOut = false;
        Game.World.Player.Moving = true;
        Game.World.Player.LookingLeft = true;
    }
}

function GetPlayerScreenCoordinates()
{
    return  {
                X: Math.floor(Game.World.Player.X / Game.Rendering.Width),
                Y: Math.floor(Game.World.Player.Y / Game.Rendering.Height)
            }
}

function GetPlayerScreensBordering()
{
    var screenCoords = GetPlayerScreenCoordinates();

    var screens = [];

    for (var xOffset = -1; xOffset < 2; xOffset++)
    {
        for (var yOffset = -1; yOffset < 2; yOffset++)
        {  
            if (!Game.Screens[screenCoords.X + xOffset])
                continue;

            if (!Game.Screens[screenCoords.X + xOffset][screenCoords.Y + yOffset])
                continue;

            screens.push({ xOffset: xOffset, yOffset: yOffset, screen: Game.Screens[screenCoords.X + xOffset][screenCoords.Y + yOffset]} );
        }
    }
    
    return screens;
}

function CreateScreen(x, y)
{
    if (!Game.Screens[x])
        Game.Screens[x] = {};

    if (!Game.Screens[x][y])
        Game.Screens[x][y] = {};
}

function GetPlayerScreen()
{
    var screenCoords = GetPlayerScreenCoordinates();

    if (!Game.Screens[screenCoords.X])
        return null;

    if (!Game.Screens[screenCoords.X][screenCoords.Y])
        return null;

    return Game.Screens[screenCoords.X][screenCoords.Y];
}

function DebugDrawLayer(screenName, r, g, b)
{
    if (!Game.Debug && !Game.LevelEditor.Enabled)
        return;

    var screens = GetPlayerScreensBordering();
    for (var key in screens)
    {
        var layer = screens[key].screen[screenName];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = layer[i];

            var blockRealX = block.x * 8;
            var blockRealY = block.y * 8;

            Game.Rendering.Context.beginPath();
            Game.Rendering.Context.rect(blockRealX + Game.World.Scroll.X, blockRealY + Game.World.Scroll.Y, 8, 8);
            Game.Rendering.Context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", 0.2)";
            Game.Rendering.Context.fill();
        }
    }
}

function DebugDrawFlower()
{
    DebugDrawLayer("Flower", 255, 105, 180);
}

function DebugDrawWater()
{
    DebugDrawLayer("Water", 0, 0, 255);
}

function DebugDrawDamage()
{
    DebugDrawLayer("Damage", 255, 0, 0);
}

function DebugDrawCollision()
{
    DebugDrawLayer("Collision", 255, 255, 0);
}

function DebugDrawSpawn()
{
    DebugDrawLayer("Spawn", 0, 255, 0);
}

function DebugDrawCheckpoint()
{
    DebugDrawLayer("Checkpoint", 0, 255, 255);
}

function DebugDrawText()
{
    DebugDrawLayer("Text", 0, 0, 0);
}

function DebugDrawMushroom()
{
    DebugDrawLayer("Mushroom", 0, 0, 0);
}

function CollisionTest(shapeA, shapeB)
{
    var vX = (shapeA.X + (shapeA.Width / 2)) - (shapeB.X + (shapeB.Width / 2));
    var vY = (shapeA.Y + (shapeA.Height / 2)) - (shapeB.Y + (shapeB.Height / 2));

    var hWidths = (shapeA.Width / 2) + (shapeB.Width / 2);
    var hHeights = (shapeA.Height / 2) + (shapeB.Height / 2);

    colDir = null;
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        // figures out on which side we are colliding (top, bottom, left, or right)
        var oX = hWidths - Math.abs(vX),
            oY = hHeights - Math.abs(vY);
        if (oX >= oY) {
            if (vY > 0) {
                colDir = { dir: "t", oY: oY };
                shapeA.Y += oY;
            } else {
                colDir = { dir: "b", oY: oY };
                shapeA.Y -= oY;
            }
        } else {
            if (vX > 0) 
            {
                colDir = { dir: "l", oX: oX };
                shapeA.X += oX;
            } 
            else if (vX < 0)
            {
                colDir = { dir: "r", oX: oX };
                shapeA.X -= oX;
            }
        }
    }
    return colDir;
}

function CollisionCheckPlayer() 
{
    var screens = GetPlayerScreensBordering();

    for (var key in screens)
    {
        var layer = screens[key].screen.Collision;

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = layer[i];

            var blockShape = 
            { 
                X: block.x * 8,
                Y: block.y * 8,
                Width: 8,
                Height: 8
            };

            var dir = CollisionTest(Game.World.Player, blockShape);
            if (dir)
            {
                if (dir.dir === "l" || dir.dir === "r") {
                    Game.World.Player.VelocityX = 0;
                    Game.World.Player.Grounded = true;

                    if (dir.oX > 0.1)
                    {
                        Game.World.Player.TongueOut = false;
                        Game.World.Player.WallJumpTimer = now + 100;
                        Game.World.Player.WallJumpOpportunity = dir.dir;
                    }
                    Game.World.Player.Jumping = false;
                } else if (dir.dir === "b") {
                    if (Game.World.Player.GroundedLastFrame && dir.oY > 0.2)
                        Game.World.Player.JustLanded = true; // b
                    Game.World.Player.Grounded = true;
                    Game.World.Player.Jumping = false;
                } else if (dir.dir === "t") {
                    Game.World.Player.Grounded = true;
                    Game.World.Player.Jumping = false;
                    Game.World.Player.VelocityY *= -1;
                }
            }
            if ((block.y * 8) - 8 == Math.floor(Game.World.Player.Y))
            {
                if ((block.x * 8) - 8 < Game.World.Player.X && (block.x * 8) > Game.World.Player.X)
                {
                    Game.World.Player.Jumping = false;
                    Game.World.Player.Grounded = true;
                }
            }
        }
    }

    /*var layer = GetPlayerScreen().Collision;

    for (var i = 0; i < layer.length; i++)
    {
        var block = layer[i];

        var blockRealX = block.x * 8;
        var blockRealY = block.y * 8;
        
        var halfX = (Game.World.Player.X + (Game.World.Player.Width / 2)) - (blockRealX + 4);
        var halfY = (Game.World.Player.Y + (Game.World.Player.Height / 2)) - (blockRealY + 4);

        var halfWidths = (Game.World.Player.Width / 2) + 4;
        var halfHeights = (Game.World.Player.Height / 2) + 4;

        if (Math.abs(halfX) < halfWidths && Math.abs(halfY) < halfHeights) 
        {
            var changeX = halfWidths - Math.abs(halfX);
            var changeY = halfHeights - Math.abs(halfY);

            if (changeX >= changeY) 
            {
                if (halfY < 0) 
                {
                    Game.World.Player.VelocityY *= -1; // t
                    Game.World.Player.Y += changeY;

                    if (!Game.World.Player.GroundedLastFrame && changeY > 0.301)
                        Game.World.Player.JustLanded = true; // b
                }
                else
                {
                    Game.World.Player.Grounded = true;
                    
                    if (!Game.World.Player.GroundedLastFrame && changeY > 0.301)
                        Game.World.Player.JustLanded = true; // b

                    Game.World.Player.Jumping = false;
                    Game.World.Player.Y -= changeY;
                }
            } 
            else 
            {
                Game.World.Player.VelocityX = 0;//changeX * 0.1;
                Game.World.Player.Jumping = false;

                if (halfX > 0) 
                    Game.World.Player.X += changeX; // l
                else 
                    Game.World.Player.X -= changeX; // r
            }
        }
    }*/
}

/*function CheckForWalljump()
{
    var layer = GetPlayerScreen().Collision;

    for (var i = 0; i < layer.length; i++)
    {
        var block = layer[i];

        var blockRealX = block.x * 8;
        var blockRealY = block.y * 8;

        if (Game.World.Player.X - 1 >= blockRealX && blockRealX + 1 <= blockRealX)
            Game.World.Player.WallJumpOpportunity == 'l';
    }
}*/

function GetCursorPos()
{
    var rect = Game.Rendering.Canvas.getBoundingClientRect();
    var scaleX = Game.Rendering.Canvas.width / rect.width;
    var scaleY = Game.Rendering.Canvas.height / rect.height;

    return {
          X: (Game.Mouse.X - rect.left) * scaleX,
          Y: (Game.Mouse.Y - rect.top) * scaleY
    };
}

function DrawCursor()
{
    //if (Game.LevelEditor.Enabled)
    //    return;

    var pos = GetCursorPos();
    DrawSprite(pos.X, pos.Y, 2, 2);
}

function WriteText(string, x, y, size)
{
    string = string.toUpperCase();
    for (var i = 0; i < string.length; i++)
    {
        var sprSheetX = 3;
        var sprSheetY = 63;

        var char = string[i];
        var charCode = string.charCodeAt(i);

        if (char == ' ')
            continue;

        if (charCode > 64 && charCode < 91) 
        { 
            sprSheetX = charCode - 65; 
            sprSheetY = 61;
        }

        if (charCode > 47 && charCode < 58)
        {
            sprSheetX = charCode - 48; 
            sprSheetY = 62;
        }

        if (char == '.') { sprSheetX = 0; sprSheetY = 63; }
        if (char == ',') { sprSheetX = 1; sprSheetY = 63; }
        if (char == '!') { sprSheetX = 2; sprSheetY = 63; }
        if (char == '?') { sprSheetX = 3; sprSheetY = 63; }

        DrawSprite(x + (i * 8), y, sprSheetX, sprSheetY);
    }

    //Game.Rendering.Context.fillStyle = 'white';
    //Game.Rendering.Context.font = "8pt 'Segoe UI'";
    //Game.Rendering.Context.fillText(string, x, y);
}

function GetLevelEditorMouseBlock()
{
    var pos = GetCursorPos();
    var xPos = Math.round((pos.X - Game.World.Scroll.X) / 8) * 8;
    var yPos = Math.round((pos.Y - Game.World.Scroll.Y) / 8) * 8; // Round to nearest block.

    return {X: xPos, Y: yPos};
}

function DrawScore()
{
    var string = "Score " + Game.Score;

    var x = Game.Rendering.Width - (string.length * 8);

    if (CreditsStart)
        x = 0;

    WriteText(string, x, 0, 1);
}

function DrawNoclip()
{
    if (!Game.World.Player.Noclip)
        return;

    var string = "Noclip";
    WriteText(string, Game.Rendering.Width - (string.length * 8), 10, 1);
}

function DrawLevelEditor()
{
    if (!Game.LevelEditor.Enabled)
        return;
    
    var block = GetLevelEditorMouseBlock();

    if (Game.LevelEditor.Layer == "Collision")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(255, 255, 0, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Water")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(0, 0, 255, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Damage")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(255, 0, 0, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Flower")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(255, 105, 180, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Spawn")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(0, 255, 0, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Checkpoint")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(0, 255, 255, 0.2)";
        Game.Rendering.Context.fill();
    }
    else if (Game.LevelEditor.Layer == "Text" || Game.LevelEditor.Layer == "Mushroom")
    {
        Game.Rendering.Context.beginPath();
        Game.Rendering.Context.rect(block.X + Game.World.Scroll.X, block.Y + Game.World.Scroll.Y, 8, 8);
        Game.Rendering.Context.fillStyle = "rgba(0, 0, 0, 0.2)";
        Game.Rendering.Context.fill();
    }
    else
        DrawScrollSprite(block.X, block.Y, Game.LevelEditor.SheetTileX, Game.LevelEditor.SheetTileY, 0.2);

    var screenCoords = GetPlayerScreenCoordinates();

    WriteText("Level Editor", 0, 0, 1);
    WriteText("Layer " + Game.LevelEditor.Layer, 0, 10, 1);
    WriteText("Tile " + Game.LevelEditor.SheetTileX + ", " + Game.LevelEditor.SheetTileY, 0, 20, 1);
    WriteText("Screen " + screenCoords.X + ", " + screenCoords.Y, 0, 30, 1);
}

function Lerp(a, b, t) 
{
    return (1-t) * a + t * b;
}

var Fly = 
{
    X: 176,
    Y: 96,
    HomeX: 176,
    HomeY: 96,
    Timer: 0,
    Left: true,
    MetPlayer: false,
}

var HasSaidIntro1 = false;
var HasSaidIntro2 = false;
var HasSaidIntro3 = false;
var HasSaidPlantIntro = false;

function DrawAndSimulateFly()
{
    if (Game.Rendering.TrippyFxTimer >= now)
        return;
    
    if (!Game.LevelEditor.Enabled && !Game.Rendering.CurrentText)
    {
        if (Game.World.Player.X >= Fly.HomeX)
        {
            Fly.MetPlayer = true;
            if (!HasSaidIntro1)
            {
                Game.Rendering.CurrentText = "pls no et me kind froge";
                HasSaidIntro1 = true;
            }
            else if (!HasSaidIntro2)
            {
                Game.Rendering.CurrentText = "u can be vegan";
                HasSaidIntro2 = true;
            }
            else if (!HasSaidIntro3)
            {
                Game.Rendering.CurrentText = "try 2 et some plant";
                HasSaidIntro3 = true;
            }
        }

        if (Fly.Timer < now)
        {
            Fly.Left = !Fly.Left;
            Fly.Timer = now + 500;
        }
        var FlyGoToX = (Fly.MetPlayer ? Game.World.Player.X : Fly.HomeX) + (Fly.Left ? -8 : 8);
        var FlyGoToY = (Fly.MetPlayer ? Game.World.Player.Y : Fly.HomeY) + (Fly.Left ? -4 : -11);

        Fly.X = Lerp(Fly.X, FlyGoToX, 1/30);
        Fly.Y = Lerp(Fly.Y, FlyGoToY, 1/30);
    }
    DrawScrollSprite(Fly.X, Fly.Y, 3, 1);
}

var TrippyEnabledLastFrame = false;
var SikMovesOver = false;
var WhereJumpOver = false;
var CreditsStart = false;

function SimulatePlayer()
{
    if (Game.LevelEditor.Enabled || Game.Rendering.CurrentText)
        return;

    Game.World.Player.InWater = IsPlayerInWater();
    Game.World.Player.InDamage = IsPlayerInDamage();

    if (Game.World.Player.InDamage && Game.World.Player.DamageTimer < now)
    {
        if (!Game.World.Player.IsPlane)
        {
            hurtfx.play();
            Game.World.Player.DamageTimer = now + 667;

            if (Game.World.Player.Health > 0)
                Game.World.Player.Health--;
        }
    }

    if (Game.World.Player.Health <= 0)
    {
        Respawn();
    }

    if (!Game.World.Player.Noclip && !Game.World.Player.IsPlane)
    {
        if (!Game.World.Player.InWater)
        {
            if (!Game.World.Player.Jumping)
                Game.World.Player.VelocityX *= Game.World.Friction;
            else
                Game.World.Player.VelocityX *= Game.World.AirResistance;

            Game.World.Player.VelocityY += Game.World.Gravity;

            //if (Game.World.Player.VelocityY > Game.World.GravityTerminalVelocity)
            //    Game.World.Player.VelocityY = Game.World.GravityTerminalVelocity;
        }
        else
        {
            Game.World.Player.VelocityY += Game.World.OceanPull;
            if (Game.World.Player.Jumping)
                Game.World.Player.VelocityX *= (Game.World.Friction + Game.World.Current);
            else
                Game.World.Player.VelocityX *= Game.World.Friction;
        }

        CollisionCheckPlayer();
    }
    else
    {
        Game.World.Player.VelocityX *= Game.World.NoclipNess;
        Game.World.Player.VelocityY *= Game.World.NoclipNess;
    }

    if (Game.World.Player.Grounded && !Game.World.Player.Noclip)
    {
         Game.World.Player.VelocityY = 0;
    }

    Game.World.Player.X += Game.World.Player.VelocityX;
    Game.World.Player.Y += Game.World.Player.VelocityY;
    
    if (!Game.World.Player.Noclip && Game.DebugScreenBoundaryClip)
    {
        /*if (Game.World.Player.X >= Game.Rendering.Width - Game.World.Player.Width) 
        {
            Game.World.Player.X = Game.Rendering.Width - Game.World.Player.Width;
        } 
        else if (Game.World.Player.X < 0) 
        {
            Game.World.Player.X = 0;
        }*/

        if(Game.World.Player.Y >= Game.Rendering.Height - Game.World.Player.Height)
        {
            Game.World.Player.Y = Game.Rendering.Height - Game.World.Player.Height;

            Game.World.Player.Grounded = true;
            
            if (!Game.World.Player.GroundedLastFrame)
                Game.World.Player.JustLanded = true;

            Game.World.Player.Jumping = false;
        }
        else if (Game.World.Player.Y < 0) 
        {
            Game.World.Player.Y = 0;
        }
    }

    if (TrippyEnabledLastFrame && Game.Rendering.TrippyFxTimer < now)
    {
        Game.World.Player.IsPlane = true;
        Game.World.Player.X = 2870;
        Game.World.Player.Y = -326;
    }

    if (!SikMovesOver && Game.Rendering.TrippyFxTimer != 0 && Game.Rendering.TrippyFxTimer + 3000 < now)
    {
        SikMovesOver = true;
        Game.Rendering.CurrentText = "sik moves froge!";
    }

    if (!WhereJumpOver && SikMovesOver && !Game.Rendering.CurrentText)
    {
        WhereJumpOver = true;
        Game.Rendering.CurrentText = "were u lern 2 jump good?";
    }

    if (!CreditsStart && SikMovesOver && WhereJumpOver && Game.Rendering.TrippyFxTimer != 0 && !Game.Rendering.CurrentText && Game.Rendering.TrippyFxTimer + 3000 < now)
    {
        Game.World.Player.IsPlane = false;   
        CreditsStart = true;
        Game.World.Player.X = 3032;
        Game.World.Player.Y = -40;
    }

    TrippyEnabledLastFrame = Game.Rendering.TrippyFxTimer >= now;
}

function DrawScreensLayers(screens, layerName)
{
    for (var key in screens)
    {
        var layer = screens[key].screen[layerName];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = layer[i];
            if (Game.Rendering.TileAnimTime <= now)
            {
                Game.Rendering.TileAnimTime = now + 400;
                Game.Rendering.TileAnimState = !Game.Rendering.TileAnimState;
            }

            var offsetX = 0;//screens[screenInstance].xOffset * Game.Rendering.Width;
            var offsetY = 0;//screens[screenInstance].yOffset * Game.Rendering.Height;

            if (Game.Rendering.TileAnimState && block.animateSprSheetX !== undefined && block.animateSprSheetX !== undefined)
                DrawScrollSprite((block.x * 8) + offsetX, (block.y * 8) + offsetY, block.animateSprSheetX, block.animateSprSheetY);
            else
                DrawScrollSprite((block.x * 8) + offsetX, (block.y * 8) + offsetY, block.sprSheetX, block.sprSheetY);
        }
    }
}

function CloneVariable(obj) 
{
    if (obj == null || typeof obj != "object") 
        return obj;

    var copy = obj.constructor();
    for (var attr in obj) 
    {
        if (obj.hasOwnProperty(attr)) 
            copy[attr] = obj[attr];
    }
    return copy;
}


function DrawSky()
{
    DrawScreensLayers(GetPlayerScreensBordering(), "Sky");
}

function DrawBackground()
{
    DrawScreensLayers(GetPlayerScreensBordering(), "Background");
}

function DrawForeground()
{
    DrawScreensLayers(GetPlayerScreensBordering(), "Foreground");
}

function GetRandomColor() 
{
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function DrawTrippyFx()
{
    if (Game.Rendering.TrippyFxTimer < now)
        return;

    for (var x = 0; x < Math.ceil(Game.Rendering.Width / 8); x++)
    {
        for (var y = 0; y < Math.ceil(Game.Rendering.Height / 8); y++)
        {
            Game.Rendering.Context.beginPath();
            Game.Rendering.Context.rect(x * 8, y * 8, 8, 8);
            Game.Rendering.Context.fillStyle = GetRandomColor();
            Game.Rendering.Context.fill();
        }
    }
}

function ProcessTongue()
{
    if (!Game.World.Player.TongueOut)
        return;

    var screens = GetPlayerScreensBordering();
    for (var key in screens)
    {
        var layer = screens[key].screen["Flower"];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = GetBlockBoundaries(layer[i]);
            var player = GetPlayerTongueBoundaries();

            if (BoundsIntersect(block, player))
            {
                var fgScreen = screens[key].screen["Foreground"];
                if (fgScreen)
                {
                    for (var j = 0; j < fgScreen.length; j++)
                    {
                        if (fgScreen[j].x == layer[i].x && fgScreen[j].y == layer[i].y)
                        {
                            fgScreen.splice(j, 1);
                        }
                    }
                }

                layer.splice(i, 1);

                Game.Score += 100;

                if (!HasSaidPlantIntro)
                {
                    Game.Rendering.CurrentText = "veri good! much better";
                    HasSaidPlantIntro = true;
                }
            }
        }
    }

    for (var key in screens)
    {
        var layer = screens[key].screen["Text"];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = GetBlockBoundaries(layer[i]);
            var player = GetPlayerTongueBoundaries();

            if (BoundsIntersect(block, player))
            {
               Game.World.Player.TongueOut = false;
               Game.Rendering.CurrentText = layer[i].text;
            }
        }
    }

    for (var key in screens)
    {
        var layer = screens[key].screen["Mushroom"];

        if (!layer)
            continue;

        for (var i = 0; i < layer.length; i++)
        {
            var block = GetBlockBoundaries(layer[i]);
            var player = GetPlayerTongueBoundaries();

            if (BoundsIntersect(block, player))
            {
               Game.Rendering.TrippyFxTimer = now + 3500;
               overworldmusic.pause();
               creditsmusic.play();
               Game.World.Player.X = 3032;
               Game.World.Player.Y = -192;
            }
        }
    }
}

function DrawText()
{
    if (!Game.Rendering.CurrentText)
        return;

    var textWidth = Game.Rendering.CurrentText.length * 8;
    var textX = (Game.Rendering.Width / 2) - (textWidth / 2);
    var textY = 52;

    Game.Rendering.Context.beginPath();
    Game.Rendering.Context.rect(textX - 8, textY - 8, textWidth + 16, 24);
    Game.Rendering.Context.fillStyle = "#000000";
    Game.Rendering.Context.fill();

    WriteText(Game.Rendering.CurrentText, textX, textY, 1);
} 

function DrawTongue()
{
    if (!Game.World.Player.TongueOut || Game.Rendering.TrippyFxTimer >= now || Game.World.Player.IsPlane)
        return;

    var RenderX = GetPlayerRenderX();
    var Alpha = GetPlayerAlpha();
    var xOffset = Game.World.Player.LookingLeft ? -8 : 8;
    var yOffset = Game.World.Player.Jumping ? -1 : 0;
    DrawScrollSprite(RenderX + xOffset, Game.World.Player.Y + yOffset, 6, 0, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    if (!Game.World.Player.LookingLeft)
        DrawScrollSprite(RenderX + (xOffset * 2), Game.World.Player.Y + yOffset, 7, 0, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    else
        DrawScrollSprite(RenderX + (xOffset * 2), Game.World.Player.Y + yOffset, 5, 1, Alpha, Game.World.Player.Width, Game.World.Player.Height);
}

function GetPlayerAlpha()
{
    return Game.World.Player.DamageTimer > now ? 0.25 : 1;
}

function GetPlayerRenderX()
{
    return Math.round(Game.Rendering.Width / 2 - Game.World.Scroll.X - Game.World.Player.Width / 2);;
}

function DrawExhaust()
{
    if (!Game.World.Player.IsPlane)
        return;

    if (Game.World.Player.ExhaustTimer < now)
    {
        Game.World.Player.ExhaustTimer = now + 400;
        Game.World.Player.ExhaustState = !Game.World.Player.ExhaustState;
    }
    
    if (Game.World.Player.ExhaustState)
        DrawScrollSprite(GetPlayerRenderX() - Game.World.Player.Width, Game.World.Player.Y, 4, 1, GetPlayerAlpha(), Game.World.Player.Width, Game.World.Player.Height);
    else
        DrawScrollSprite(GetPlayerRenderX() - Game.World.Player.Width, Game.World.Player.Y, 4, 2, GetPlayerAlpha(), Game.World.Player.Width, Game.World.Player.Height);
}

function DrawPlayer()
{
    var yOffset = Game.World.Player.LookingLeft ? 3 : 0;

    var Alpha = GetPlayerAlpha();
    var RenderX = GetPlayerRenderX();

    
    if (!WasTongueOutLastFrame && Game.Rendering.TrippyFxTimer < now && Game.World.Player.TongueOut && !Game.World.Player.IsPlane)
    {
            if (tonguefx.paused)
                tonguefx.play();
            else if (tongue2fx.paused)
                tongue2fx.play();
            else if (tongue3fx.paused)
                tongue3fx.play();
    }

    Game.World.Scroll.Y = - (Game.Rendering.Height * GetPlayerScreenCoordinates().Y);

    if (Game.Rendering.TrippyFxTimer >= now)
        return;

    if (Game.World.Player.JustLanded)
    {
        Game.World.Player.JustLandedAnimationTimer = now + 80;
    }


    if (Game.World.Player.IsPlane)
    {
        DrawScrollSprite(RenderX, Game.World.Player.Y, 4, 0, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    } 
    else if (Game.World.Player.WallJumpTimer > now && Game.World.Player.WallJumpOpportunity == 'r')
    {
        DrawScrollSprite(RenderX, Game.World.Player.Y, 2, 4, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    } 
    else if (Game.World.Player.WallJumpTimer > now && Game.World.Player.WallJumpOpportunity == 'l')
    {
        DrawScrollSprite(RenderX, Game.World.Player.Y, 2, 1, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    }
    else if (Game.World.Player.JustLandedAnimationTimer > now)
    {
        DrawScrollSprite(RenderX, Game.World.Player.Y, 0, 1 + yOffset, Alpha, Game.World.Player.Width, Game.World.Player.Height);
        Game.World.Player.WalkAnimationTimer = 0;
        Game.World.Player.MovementNumber = 0;
    }
    else if (Game.World.Player.Jumping)
    {
        Game.World.Player.WalkAnimationTimer = 0;
        Game.World.Player.JustLandedAnimationTimer = 0;
        Game.World.Player.MovementNumber = 0;
        if (!Game.World.Player.TongueOut)
            DrawScrollSprite(RenderX, Game.World.Player.Y, 1, 1 + yOffset, Alpha, Game.World.Player.Width, Game.World.Player.Height);
        else
        {
            if (!Game.World.Player.LookingLeft)
                DrawScrollSprite(RenderX, Game.World.Player.Y, 5, 2, Alpha, Game.World.Player.Width, Game.World.Player.Height);
            else
                DrawScrollSprite(RenderX, Game.World.Player.Y, 6, 2, Alpha, Game.World.Player.Width, Game.World.Player.Height);
        }
    }
    else if (Game.World.Player.VelocityX >= 1 || Game.World.Player.VelocityX <= -1 || Game.World.Player.Moving)
    {
        if (Game.World.Player.WalkAnimationTimer < now && !Game.Rendering.CurrentText)
        {
            Game.World.Player.MovementNumber++;

            if (Game.World.Player.MovementNumber > 3)
                Game.World.Player.MovementNumber = 0;

            Game.World.Player.WalkAnimationTimer = now + 80;
        }

        Game.World.Player.JustLandedAnimationTimer = 0;

        DrawScrollSprite(RenderX, Game.World.Player.Y, Game.World.Player.MovementNumber, 0 + yOffset, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    }
    else
    {
        Game.World.Player.WalkAnimationTimer = 0;
        Game.World.Player.JustLandedAnimationTimer = 0;
        Game.World.Player.MovementNumber = 0;

        if (Game.World.Player.TongueOut)
        {
            if (!Game.World.Player.LookingLeft)
                DrawScrollSprite(RenderX, Game.World.Player.Y, 5, 0, Alpha, Game.World.Player.Width, Game.World.Player.Height);
            else
                DrawScrollSprite(RenderX, Game.World.Player.Y, 6, 1, Alpha, Game.World.Player.Width, Game.World.Player.Height);
        }
        else
            DrawScrollSprite(RenderX, Game.World.Player.Y, 0, 0 + yOffset, Alpha, Game.World.Player.Width, Game.World.Player.Height);
    }
}

function DrawLine(sx, sy, tx, ty) 
{
    var hold;
    if (sx > tx)
    {
        hold = tx;
        tx = sx;
        sx = hold;

        hold = ty;
        ty = sy;
        sy = hold;
    }

    var dx = tx - sx;
    var dy = ty - sy;

    for (var x = sx; x <= tx; x++)
    {
        var y = sy + dy * (x - sx) / dx;
        Game.Rendering.Context.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
}

function ClearScreen()
{
    Game.Rendering.Context.clearRect(0, 0, Game.Rendering.Width, Game.Rendering.Height);
}

function GetPlayerCenterX()
{
    return Game.World.Player.X + (Game.World.Player.Width / 2);
}

NewLevelLoaded();

var lastUpdate = Date.now();
var now = Date.now();
var dt = now - lastUpdate;
function Update()
{
	window.focus();
	
    now = Date.now();
    dt = now - lastUpdate;

    lastUpdate = now;

    Game.Rendering.FrameNumber++;

    Game.World.Player.GroundedLastFrame = Game.World.Player.Grounded;
    
    Game.World.Player.Moving = false;
    Game.World.Player.JustLanded = false;

    if (Game.World.Player.WallJumpTimer < now)
        Game.World.Scroll.X = Math.round(-GetPlayerCenterX() + Game.Rendering.Width / 2);

    //CheckForWalljump();
    ProcessInput();
    Game.World.Player.Grounded = false;

    if (Game.World.Player.VelocityX > Game.World.Player.TerminalVelocity)
        Game.World.Player.VelocityX =  Game.World.Player.TerminalVelocity;

    if (Game.World.Player.VelocityX < -Game.World.Player.TerminalVelocity)
        Game.World.Player.VelocityX = -Game.World.Player.TerminalVelocity;

    SimulatePlayer();
    ProcessCheckpoints();

    ProcessTongue();
    
    ClearScreen();

    DrawTrippyFx();  
    DrawSky();
    DrawBackground();
    DrawTongue();
    DrawExhaust();
    DrawPlayer();
    DrawAndSimulateFly();
    DrawForeground();  

    DebugDrawText();
    DebugDrawSpawn();
    DebugDrawCheckpoint();
    DebugDrawCollision();
    DebugDrawDamage();
    DebugDrawWater();
    DebugDrawFlower();
    DebugDrawMushroom();
    
    DrawLevelEditor();
    DrawScore();
    DrawNoclip();
    DrawHealth();
    DrawText();
    DrawCursor();

    Game.KeysThisFrame = [];
    Game.MouseRightPressed = false;
    Game.MousePressedLastFrame = Game.MousePressed;
        
    requestAnimationFrame(Update);
}

document.body.addEventListener("mousedown", function(e) {
     if (e.button === 0)
        Game.MousePressed = true;
    else
        Game.MouseRightPressed = true;
        
    e.preventDefault();
});

document.body.addEventListener("mouseup", function(e) {
     if (e.button === 0)
        Game.MousePressed = false;
    else
        Game.MouseRightPressed = false;

    e.preventDefault();
});

document.body.addEventListener("keydown", function(e) {
    Game.KeysThisFrame[e.keyCode] = !(Game.Keys[e.keyCode] || Game.KeysThisFrame[e.keyCode]);
    Game.Keys[e.keyCode] = true;

    if (e.keyCode > 111 && e.Keys < 123)
        e.preventDefault();
});

document.body.addEventListener("keyup", function(e) {
    Game.Keys[e.keyCode] = false;
    e.preventDefault();
});

document.body.addEventListener("contextmenu", function(e) {
    Game.MouseRightPressed = true;
    e.preventDefault();
    return false;
});


window.addEventListener("load",function(){
    Update();
});