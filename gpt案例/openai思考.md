openai 可以帮我做的事情

1. 展示产业链的各个环节(这样新闻出来之后就知道产业链的哪个部分有影响)
2. 产业链各环节的成本展示(有利于计算公司经营成本，同时配合公司库存，有利于抄底)
   <1>爬虫替我爬取数据，实时更新数据，
3. 新闻对产业链的影响。

报告部分：

1. 成本变动带来的需求变动，预测需求顶底
2.

pdf 压缩和提取文本

1. code 项目：https://github.com/unidoc/unipdf
2. 直接用网站：https://www.pdf2go.com/

## 提问技巧

### Principle 1: Write clear and specific instructions

1. 分隔符将目标语句分开来，避免 chat 将目标语句和普通描述或指令语句混合在一起.分隔符可以是一下

   - 三个单切号：`目标语句`
   - 双引号："""目标语句"""
   - XML 标记：<div>目标语句<div>
   - 章节标题： <目标语句>
   - 虚线：--- 目标语句 ---

2. JSON、HTML 的结构输出的问句。

   - 例：给我一个关于 XX 的 list,Provide them in json format width the following keys: book_id, title, author, genre.

3. check whether conditions are satisfied. Check assumptions required to do the task.

   - 例：`f"""you will provided width text delimited by triple quotes. If it contains a sequence of instructions, re-write those instructions in following format:
     Step1 - ...
     Step2 - ...
     ...
     StepN - ...
     If the text does not contains a sequence of instructions, then simply write \"No steps provided.\"

   \"\"\"{text}\"\"\"
   """`

4. Few-shot prompting. Give successful examples of completing tasks then ask model to perform the task.

   - 例：`f"""Your task is to answer in a consistent style.
<child>: Teach me about patience.
<grandparent>: The river that carves the deepest valley flows from a modest spring; \
grandest symphony originates from single note; \
the most intricate begins width a solitary thread.
<child>:  Teach me about resilience`

### Principle 2: Give the Model time to think

> 如果一个模型因为匆忙得出不正确的结论而产生的推理错误，您应该尝试红心构建查询，在模型给出最终答案之前，要求进行一系列相关的推理。另一个思考模式是，如果你给模型一个太复杂的任务，在短时间内，或者使用少量的文字，它无法完成，它很可能会给出一个不正确的猜测。这也发生在人的身上，比如让某个人在较短的时间内计算一个很复杂的数学问题，它很有可能犯错。所以在这种情况下，要指示模型使用更长的时间来思考，这也意味着，完成这项任务需要花费更多的算力。

1. 指定步骤去完成任务

   - 例 1：`f"""
     Preform the following actions:

     1. - Summaries the following text delimited by triple backticks with sentence.
     2. - Translate the summary into French.
     3. - List each name in the French summary.
     4. - Output a json object that contains the following keys: french_summary, num_names.

     Separate your answers width line breaks.
     Text:`{text}`
     """`

   - 例 2(增加输出格式)：`f"""
     Your task is to preform the following actions:

   1. - Summaries the following text delimited by <> with 1 sentence.
   2. - Translate the summary into French. triple quotes with 1 sentence.
   3. - List each name in the French summary.
   4. - Output a json object that contains the following keys: french_summary, num_names.

   Use the following format:
   Text: <text to summary>
   Summary: <Summary>
   Translation: <Summary Translation>
   Names: <List of names in Italian summary>
   Output JSON: <json width summary and num_name>

   Text:`{text}`
   """`

2. instruct the model to work out its own solutions before rushing to a conclusion.(在得到结论之前，教模型自己推理出解决方案)

   - 例：`f"""
     Your task is to determine if the student's solutions is correct or not.
     To solve the problem do the following:
   - First, work out your own solutions to the problem.
   - Then compare your solution to the student's solution and evaluate if the student's solutions is correct not. Don't decide if the student's is correct until you have done the problem yourself.
     Use the following format:
     Question:

   ```
   question here:
   ```

   student's solution:

   ```
   student's solution here:
   ```

   Actual solution:

   ```
   steps to work out the solution and your solution here
   ```

   Is the student's solution the same as actual solution just calculated:

   ```
   yes or no
   ```

   Student grade:

   ```
   correct or incorrect
   ```

   Question:

   ```
   I'm building a solar power installation and I need help working out the financial.
   - Land costs $100 / square foot
   - I can buy solar panels  for $250 / square foot.
   - I negotiated a contract for maintenance that will costs me a flat $100 per year, and an additional $10 / square foot
   What is the total cost for the first year of operations as a function of number of square feet.
   ```

   Student's solution:

   ```
   Let x be the size of installation in square feet.
   Costs:
   1. Land cost: 100x.
   2. Solar panel cost: 250x.
   3. Maintenance cost: 100,000 + 100x
   Total cost: 100x + 250x + 100,000 + 100x = 450x +100,000
   ```

   Actual solution:
   """`

   ```

   ```

### Model Limitations

1. Hallucination(幻觉)。makes statements that sound plausible but are not true.(大语言模型，随便有很多知识，但是它不知道知识的边界，所以经常造出来，看似正确，但是不正确的事情。其实就是单字向量导致的指向有很多，但是这些向量不知道哪些情况不应该连接)

   - 例：我之前问非凡洋红颜色到海昌眼镜的颜色时，给我创造了很多海昌没有的眼睛颜色系列。
   - 解决方法：First find relevant information, then answer the question based on the relevant information.

## 写提示词

### 限制字数，或者长度：

1. use at most 50 words.(实际上，可能会给出超过 50 的长度，不是那么精确，但是在一个合理的范围)
2. use at most 3 sentences.
3. use at most 200 characters.

### 总结文本

1. `f"""
   Your task is to generate a short summary of product review from ecommerce site. \
    Summaries the review below. delimited by triple backticks, in most 30 words.

   Review: `{prod_view}`
   """`

   - 同时可以修改这段话的侧重点。

### 提取信息，而不是总结

1. ````f"""
    Your task is to extract relevant information from a product review from ecommerce site to give feedback \
    to the Shipping department.
    From the review below, delimited by triple backticks,  extract to shipping and delivery. Limit to 30 words.

    Review: `{prod_view}`
   """```
   ````
