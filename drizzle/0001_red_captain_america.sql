CREATE TABLE `activityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`type` varchar(80) NOT NULL,
	`detail` text NOT NULL,
	`status` enum('started','succeeded','failed','info') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`trigger` varchar(80) NOT NULL,
	`action` text NOT NULL,
	`cronExpression` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automationWorkflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `imageGenerations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`prompt` text NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imageGenerations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`status` enum('running','succeeded','failed') NOT NULL,
	`output` text,
	`error` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflowRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_events_owner_created_idx` ON `activityEvents` (`ownerOpenId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workflows_owner_updated_idx` ON `automationWorkflows` (`ownerOpenId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `workflows_cron_task_idx` ON `automationWorkflows` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `chat_messages_conversation_idx` ON `chatMessages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `conversations_owner_updated_idx` ON `conversations` (`ownerOpenId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `image_generations_owner_created_idx` ON `imageGenerations` (`ownerOpenId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workflow_runs_workflow_started_idx` ON `workflowRuns` (`workflowId`,`startedAt`);