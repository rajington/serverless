# serverless.env.yml

The `serverless.env.yml` file includes environment specific configuration. This includes listing your stages and their
regions. It also manages variables at 3 levels ordered by priority:

1. Region Variables: For a specific region in a specific stage.
2. Stage Variables: For a specific stage.
3. Common Variables: For all stages and regions.


```yml
vars:
  someVar: 1
stages:
  dev:
    vars:
      someVar: 2
    regions:
      us-east-1:
        vars:
          someVar: 3
```

Notice that you have the same variable defined in as common, stage and region variable. In that case the region variable
will be used. If you removed the region variable, the stage variable will be used... and so on.
