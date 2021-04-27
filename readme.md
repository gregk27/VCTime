# VCTime
VCTime is a discord bot which displays the current time in a voice channel
This is target at users who have the overlay enabled, as it provides a convinently located clock.

## Commands
### !time
When this command is run, VCTime will join the sender's voice channel
### !time leave
When this command is run, VCTime will leave the sender's channel

The bot will leave automatically if the channel is empty when it updates
### !time zone
Set the clock's timezone. This supports most [tz/IANA timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
### !time format
Set the clock's format. This takes a format using [Luxon tokens](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens)

## Adding the bot
The bot can be added to your server with the following link: https://discord.com/oauth2/authorize?client_id=836423868017147934&scope=bot&permissions=68226048

Please allow all requested permissions (send/read messages, join voice channels, change nickname) as they are required for operation.
## Privacy
This bot stores server IDs alongside timezone and format preferences as that is required for persistence.