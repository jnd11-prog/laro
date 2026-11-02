CREATE TABLE `careers` (
	`club` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`invite` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_invite_unique` ON `clubs` (`invite`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`actor` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `phrases` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`phrase` text NOT NULL,
	`meaning` text NOT NULL,
	`context` text NOT NULL,
	`category` text NOT NULL,
	`audio` text,
	`source` text,
	`created` integer NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
